use crate::db::MongoDBClient;
use crate::utils::{JWTHandler, PasswordHasherHandler};
use actix_web::{error, post, web, HttpResponse, Responder, Result};
use jwt_simple::prelude::*;
use mongodb::bson::doc;
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Debug)]
pub struct LoginHandler {
    /// The email of the user that's used for login
    pub email: String,

    /// The argon2 hashed password
    pub password: String,
}

/// custom claims used as payload for jwt
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct CustomClaims {
    /// The email of the user
    pub email: String,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct JWTResponse {
    /// Access token used for authentication
    pub access_token: String,

    /// Refresh token used for refreshing the access token
    pub refresh_token: String,
}

#[post("/login")]
pub async fn login(
    mongodb_client: web::Data<MongoDBClient>,
    login_handler: web::Json<LoginHandler>,
) -> Result<impl Responder> {
    let login_handler = login_handler.0;

    let db = &mongodb_client.database;
    let users_collection = db.collection::<LoginHandler>("users");

    let user_filter_option = doc! {
        "email" : &login_handler.email
    };

    match users_collection.find_one(user_filter_option, None).await {
        Ok(Some(user)) => {
            let is_valid =
                PasswordHasherHandler::verify(login_handler.password.as_bytes(), &user.password);
            if is_valid {
                let custom_claims = CustomClaims {
                    email: user.email.clone(),
                };
                let access_token = JWTHandler::generate_jwt(
                    custom_claims.clone(),
                    Duration::from_hours(24),
                    "secret",
                )
                .unwrap();
                let refresh_token = JWTHandler::generate_jwt(
                    custom_claims.clone(),
                    Duration::from_days(30),
                    "secret",
                )
                .unwrap();

                let jwt_response = JWTResponse {
                    access_token,
                    refresh_token,
                };
                Ok(HttpResponse::Ok().json(jwt_response))
            } else {
                Err(error::ErrorUnauthorized("Invalid Password"))
            }
        }
        Ok(None) => Err(error::ErrorNotFound("User not found")),
        Err(err) => {
            log::error!("Database Error | ${err:?}");
            Err(error::ErrorInternalServerError("Internal Server Error"))
        }
    }
}
