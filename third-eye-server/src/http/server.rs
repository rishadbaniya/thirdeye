use super::routes::user::{create_user, get_user, get_users, update_user, delete_user};
use super::routes::group::{create_group, get_group, get_groups};
use super::routes::device::create_device;
use super::routes::change_handler::run_ws_server;
use actix_web::web::Data;
use actix_web::{HttpServer, App};
use actix_web::{post, get, delete, put, patch};
use std::sync::Arc;
use crate::db::MongoDBClient;
use crate::config::HttpServerConfig;

pub async fn run_http_server(mongodb_client: Arc<MongoDBClient>, http_server_config: HttpServerConfig) -> anyhow::Result<()>{
    HttpServer::new(move || {
        App::new()
            .app_data(Data::from(mongodb_client.clone()))
            .service(create_user)
            .service(get_user)
            .service(get_users)
            .service(update_user)
            .service(delete_user)
            .service(create_group)
            .service(get_group)
            .service(get_groups)
            .service(create_device)
            .route("/fetch-change", actix_web::web::get().to(run_ws_server))
            // TODO pass the http server config too as app data
    })
    .bind(http_server_config.address)
    .unwrap()
    .run()
    .await?;
    Ok(()) 
}

