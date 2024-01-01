use crate::{db::MongoDBClient, http::routes::device::NewDevice};
use actix_web::{rt, web, Error, HttpRequest, HttpResponse};
use actix_ws::Message;
use futures_util::{
    future::{self, Either},
    StreamExt as _,
};
use mongodb::bson::doc;
use serde::{Deserialize, Serialize};
use std::time::{Duration, Instant};
use tokio::{pin, time::interval};

const HEARTBEAT_INTERVAL: Duration = Duration::from_secs(5);

const CLIENT_TIMEOUT: Duration = Duration::from_secs(10);

#[derive(Deserialize, Serialize, Debug)]
pub struct DeviceIdentifier {
    pub device_id: String,
}

pub async fn fetch_change(
    mut session: actix_ws::Session,
    mut msg_stream: actix_ws::MessageStream,
    mongo_client: web::Data<MongoDBClient>,
) {
    let mut last_heartbeat = Instant::now();
    let mut interval = interval(HEARTBEAT_INTERVAL);

    let reason = loop {
        let tick = interval.tick();
        pin!(tick);
        match future::select(msg_stream.next(), tick).await {
            Either::Left((Some(Ok(msg)), _)) => {
                log::debug!("msg: {msg:?}");
                match msg {
                    Message::Close(reason) => {
                        break reason;
                    }

                    Message::Text(bytes) => {
                        let ident = String::from(bytes);
                        let device_identifier: DeviceIdentifier = serde_json::from_str(&ident).unwrap();
                        last_heartbeat = Instant::now();
                        let db = &mongo_client.database;
                        let devices_collection = db.collection::<NewDevice>("devices");
                        let pipeline = vec![doc! {
                            "$match" : {
                                "device_id" : device_identifier.device_id,
                            }
                        }];
                        let mut change_stream = match devices_collection.watch(pipeline, None).await
                        {
                            Ok(change_stream) => change_stream,
                            Err(err) => {
                                log::error!("Failed to set up MongoDB change stream: {:?}", err);
                                break None;
                            }
                        };

                        while let Some(change_result) = change_stream.next().await {
                            match change_result {
                                Ok(change) => {
                                    let change_str = format!("{:?}", change);
                                    let _ = session.text(change_str).await;
                                }
                                Err(err) => {
                                    log::error!("Failed to get next change from MongoDB change stream: {:?}", err);
                                    let _ = session.text(format!("Failed to get next change from MongoDB change stream: {:?}", err)).await;
                                }
                            }
                        }
                    }

                    Message::Pong(_) => {
                        last_heartbeat = Instant::now();
                    }

                    Message::Ping(bytes) => {
                        last_heartbeat = Instant::now();
                        let _ = session.pong(&bytes).await;
                    }

                    _ => {}
                };
            }
            Either::Left((Some(Err(err)), _)) => {
                log::error!("{}", err);
                break None;
            }
            Either::Left((None, _)) => break None,
            Either::Right((_inst, _)) => {
                if Instant::now().duration_since(last_heartbeat) > CLIENT_TIMEOUT {
                    log::info!(
                        "client has not sent heartbeat in over {CLIENT_TIMEOUT:?}; disconnecting"
                    );

                    break None;
                }
                let _ = session.ping(b"").await;
            }
        }
    };
    let _ = session.close(reason).await;

    log::info!("disconnected");
}

pub async fn run_ws_server(
    req: HttpRequest,
    stream: web::Payload,
    mongo_client: web::Data<MongoDBClient>,
) -> Result<HttpResponse, Error> {
    println!("GOT A REQUESAT HERE AT WS SERVER");
    let (res, session, msg_stream) = actix_ws::handle(&req, stream)?;
    rt::spawn(fetch_change(session, msg_stream, mongo_client.clone()));

    Ok(res)
}
