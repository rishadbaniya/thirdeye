use super::routes::auth::{login, logout, refresh};
use super::routes::user::{create_user, get_user, get_users, update_user, delete_user};
use super::routes::group::{create_group, get_group, get_groups};
use actix_web::web::Data;
use actix_web::{HttpServer, App};
use std::sync::Arc;
use crate::db::{MongoDBClient, RedisClient};
use crate::config::ThirdEyeServerConfig;

pub async fn run_http_server(
    mongodb_client: Arc<MongoDBClient>,
    redis_client: Arc<RedisClient>,
    third_eye_server_config: Arc<ThirdEyeServerConfig>
) -> anyhow::Result<()>{
    let http_server_addr = third_eye_server_config.http_server_config.address.clone();

    HttpServer::new(move || {
        App::new()
            .app_data(Data::from(mongodb_client.clone()))
            .app_data(Data::from(redis_client.clone()))
            .app_data(Data::from(third_eye_server_config.clone()))
            .service(login)
            .service(logout)
            .service(refresh)
            .service(create_user)
            .service(get_user)
            .service(get_users)
            .service(update_user)
            .service(delete_user)
            .service(create_group)
            .service(get_group)
            .service(get_groups)
            // TODO pass the http server config too as app data
    })
    .bind(http_server_addr)
    .unwrap()
    .run()
    .await?;
    Ok(()) 
}
