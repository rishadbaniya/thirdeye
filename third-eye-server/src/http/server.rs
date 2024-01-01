use super::middlewares::authorization::AuthReq;
use super::routes::auth::{login, logout, refresh};
use super::routes::device::{create_device, get_device, get_devices, delete_device};
use super::routes::group::{create_group, get_group, get_groups};
use super::routes::poll_device_change::run_ws_server;
use super::routes::user::{create_user, delete_user, get_user, get_users, update_user};
use crate::config::ThirdEyeServerConfig;
use crate::db::{MongoDBClient, RedisClient};
use actix_cors::Cors;
use actix_web::web::Data;
use actix_web::{App, HttpServer};
use std::sync::Arc;

pub async fn run_http_server(
    mongodb_client: Arc<MongoDBClient>,
    redis_client: Arc<RedisClient>,
    third_eye_server_config: Arc<ThirdEyeServerConfig>,
) -> anyhow::Result<()> {
    let http_server_addr = third_eye_server_config.http_server_config.address.clone();

    HttpServer::new(move || {
        // TODO: Change to more restrictive rules. permissive() is only for development.
        let mut cors = Cors::permissive().expose_headers(["Content-Range"]);

        App::new()
            .wrap(cors)
            .app_data(Data::from(mongodb_client.clone()))
            .app_data(Data::from(redis_client.clone()))
            .app_data(Data::from(third_eye_server_config.clone()))
            .service(login)
            .service(logout)
            .service(refresh)
            .wrap(AuthReq)
            .service(create_user)
            .service(get_user)
            .service(get_users)
            .service(update_user)
            .service(delete_user)
            .service(create_group)
            .service(get_group)
            .service(get_groups)
            .service(create_device)
            .service(get_device)
            .service(get_devices)
            .service(delete_device)
            .route("/change", actix_web::web::get().to(run_ws_server))
        // TODO pass the http server config too as app data
    })
    .bind(http_server_addr)
    .unwrap()
    .run()
    .await?;
    Ok(())
}
