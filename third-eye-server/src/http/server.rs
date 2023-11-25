use super::routes::group::{create_group, get_group, get_groups};
use super::routes::login::login;
use super::routes::user::{create_user, delete_user, get_user, get_users, update_user};
use crate::config::HttpServerConfig;
use crate::db::MongoDBClient;
use actix_web::web::Data;
use actix_web::{delete, get, patch, post, put};
use actix_web::{App, HttpServer};
use std::sync::Arc;

pub async fn run_http_server(
    mongodb_client: Arc<MongoDBClient>,
    http_server_config: HttpServerConfig,
) -> anyhow::Result<()> {
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
            .service(login)
        // TODO pass the http server config too as app data
    })
    .bind(http_server_config.address)
    .unwrap()
    .run()
    .await?;
    Ok(())
}
