#![allow(non_snake_case)]
use crate::{
    config::ThirdEyeServerConfig,
    db::{MongoDBClient, RedisClient},
    utils::PasswordHasherHandler,
};
use actix_web::{
    error, post,
    web::{self},
    HttpResponse, Responder, Result,
};
use anyhow::Context;
use chrono::{Duration, Local};
use jsonwebtoken::{decode, encode, DecodingKey, EncodingKey, Header, Validation};
use mongodb::bson::{doc, Document};
use serde::{Deserialize, Serialize};
use serde_json::json;

#[derive(Debug, Deserialize)]
pub struct LoginCredential {
    /// The primary email of the user
    email: String,

    /// The password of the user
    password: String,
}

type EpochTime = i64;

/// Claim for JWT that we get from access token
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct AccessTokenClaim {
    /// The identifier of the user
    pub email: String,

    /// The expiry time of this token
    pub exp: EpochTime,
}

impl AccessTokenClaim {
    /// Generate a access token claim with expiry of expMins "minutes" from current local time this
    /// server is running on
    pub fn generate<T: AsRef<str>>(email: T, expMins: i64) -> Self {
        let exp = {
            let exp_time = Local::now() + Duration::minutes(expMins);
            exp_time.timestamp()
        };

        Self {
            email: email.as_ref().to_string(),
            exp,
        }
    }
}

/// Claim for JWT that we get from access token
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct RefreshTokenClaim {
    /// The identifier of the user
    pub email: String,

    /// The expiry time of this token
    pub exp: EpochTime,
}

impl RefreshTokenClaim {
    /// Generate a access token claim with expiry of expMins "minutes" from current local time this
    /// server is running on
    pub fn generate<T: AsRef<str>>(email: T, expMins: i64) -> Self {
        let exp = {
            let exp_time = Local::now() + Duration::minutes(expMins);
            exp_time.timestamp()
        };

        Self {
            email: email.as_ref().to_string(),
            exp,
        }
    }
}

// TODO: Log invalid crednetials, from which IP it came, don't log the password
#[post("/login")]
pub async fn login(
    mongodb_client: web::Data<MongoDBClient>,
    third_eye_server_config: web::Data<ThirdEyeServerConfig>,
    lc: web::Json<LoginCredential>,
) -> Result<impl Responder> {
    let http_server_config = &third_eye_server_config.http_server_config;
    let access_token_expiry_time = http_server_config.access_token_expiry_time;
    let access_token_key = http_server_config
        .access_token_key
        .as_ref()
        .context("Access Token Key Not Available")
        .unwrap();

    let refresh_token_expiry_time = http_server_config.refresh_token_expiry_time;
    let refresh_token_key = http_server_config
        .refresh_token_key
        .as_ref()
        .context("Refresh Token Key Not Available")
        .unwrap();

    let db = &mongodb_client.database;
    let users_collection = db.collection::<Document>("users");
    let email = &lc.0.email;
    let password = &lc.0.password;

    let user_filter_option = doc! {
        "email" : email,
    };

    return match users_collection.find_one(user_filter_option, None).await {
        Ok(Some(d)) => {
            if let Some(p) = d.get("password") {
                let hashed_password = p.as_str().unwrap();
                let isCorrect = PasswordHasherHandler::verify(password.as_bytes(), hashed_password);
                if isCorrect {
                    let access_token_claim =
                        AccessTokenClaim::generate(email, access_token_expiry_time);
                    let access_token = encode(
                        &Header::default(),
                        &access_token_claim,
                        &EncodingKey::from_base64_secret(access_token_key)
                            .context("There's some issue with the access token key you provided")
                            .unwrap(),
                    )
                    .unwrap();

                    // a new refresh token
                    let new_refresh_token_claim =
                        RefreshTokenClaim::generate(email, refresh_token_expiry_time);
                    let refresh_token = encode(
                        &Header::default(),
                        &new_refresh_token_claim,
                        &EncodingKey::from_base64_secret(refresh_token_key)
                            .context("There's some issue with the refresh token key you provided")
                            .unwrap(),
                    )
                    .unwrap();

                    let login_response = json!({
                        "access_token" : access_token,
                        "refresh_token" : refresh_token,
                    });

                    Ok(HttpResponse::Ok().body(serde_json::to_string(&login_response).unwrap()))
                } else {
                    Err(error::ErrorUnauthorized("Invalid Crednetials"))
                }
            } else {
                log::error!("No any password field for use, for the user with email ${email}");
                Err(error::ErrorInternalServerError("Internal Server Error"))
            }
        }
        Ok(None) => {
            // wrong email from the user but we'll say wrong credentials to the user, not the
            // specific i.e which one
            Err(error::ErrorUnauthorized("Unauthorized"))
        }
        Err(e) => {
            log::error!("Database Error ${email} | {e:?}");
            Err(error::ErrorInternalServerError("Internal Server Error"))
        }
    };
}

/// Request coming with a refresh token
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct RefreshRequest {
    /// The refresh token
    pub refresh_token: String,
}

// TODO: Log invalid crednetials, from which IP it came, don't log the password
#[post("/refresh")]
pub async fn refresh(
    redis_client: web::Data<RedisClient>,
    mongodb_client: web::Data<MongoDBClient>,
    third_eye_server_config: web::Data<ThirdEyeServerConfig>,
    refresh_request: web::Json<RefreshRequest>,
) -> Result<impl Responder> {
    let http_server_config = &third_eye_server_config.http_server_config;
    let access_token_expiry_time = http_server_config.access_token_expiry_time;
    let access_token_key = http_server_config
        .access_token_key
        .as_ref()
        .context("Access Token Key Not Available")
        .unwrap();

    let refresh_token_expiry_time = http_server_config.refresh_token_expiry_time;
    let refresh_token_key = http_server_config
        .refresh_token_key
        .as_ref()
        .context("Refresh Token Key Not Available")
        .unwrap();

    let decoding_key = DecodingKey::from_base64_secret(refresh_token_key)
        .context("Not a valid Refresh Token Key")
        .unwrap();
    let validation = Validation::default();
    let refresh_token = &refresh_request.0.refresh_token;

    let mut redis_con = match redis_client.client.get_connection() {
        Ok(con) => con,
        Err(err) => {
            log::error!("Failed to connect to Redis: {err:?}");
            return Err(error::ErrorInternalServerError("Internal Server Error"));
        }
    };

    // first we'll check if the refresh token is in the invalidated list or not
    if redis::Cmd::exists(refresh_token)
        .query(&mut redis_con)
        .unwrap()
    {
        Err(error::ErrorBadRequest("Used Token"))
    } else {
        let db = &mongodb_client.database;
        let users_collection = db.collection::<Document>("users");

        // if it isn't invalidated then we proceed on checking if the token is a valid token
        // or not and get data out of it
        return match decode::<RefreshTokenClaim>(refresh_token, &decoding_key, &validation) {
            Ok(token_data) => {
                let refresh_token_claim = token_data.claims;
                let user_filter_option = doc! {
                    "email" : &refresh_token_claim.email
                };

                // we'll check if the user exists or not anymore
                return match users_collection.find_one(user_filter_option, None).await {
                    Ok(Some(_)) => {
                        let new_access_token_claim = AccessTokenClaim::generate(
                            &refresh_token_claim.email,
                            access_token_expiry_time,
                        );

                        // a new access_token
                        let new_access_token = encode(
                            &Header::default(),
                            &new_access_token_claim,
                            &EncodingKey::from_base64_secret(access_token_key)
                                .context(
                                    "There's some issue with the access token key you provided",
                                )
                                .unwrap(),
                        )
                        .unwrap();

                        // a new refresh token
                        let new_refresh_token_claim = RefreshTokenClaim::generate(
                            &refresh_token_claim.email,
                            refresh_token_expiry_time,
                        );
                        let new_refresh_token = encode(
                            &Header::default(),
                            &new_refresh_token_claim,
                            &EncodingKey::from_base64_secret(refresh_token_key)
                                .context(
                                    "There's some issue with the access token key you provided",
                                )
                                .unwrap(),
                        )
                        .unwrap();

                        // put the provided refresh token in the invalidated list
                        // TODO:  So calculate the remaining time, for that we would
                        // need to have the issued date
                        match redis::cmd("SET")
                            .arg(refresh_token)
                            .arg(0)
                            .arg("EX")
                            .arg(refresh_token_expiry_time * 60)
                            .query::<()>(&mut redis_con)
                        {
                            Ok(_) => {
                                let refresh_response = json!({
                                    "new_access_token" : new_access_token,
                                    "new_refresh_token" : new_refresh_token,
                                });
                                Ok(HttpResponse::Ok()
                                    .body(serde_json::to_string(&refresh_response).unwrap()))
                            }
                            Err(err) => {
                                log::error!("Error in invalidating the refresh token {refresh_token} | ${err:?}");
                                Err(error::ErrorInternalServerError("Internal Server Error"))
                            }
                        }
                    }
                    Ok(None) => Err(error::ErrorBadRequest("User doesn't exist")),
                    Err(err) => {
                        log::error!("Database connection error | {err:?}");
                        Err(error::ErrorInternalServerError("Internal Server Error"))
                    }
                };
            }
            Err(_) => Err(error::ErrorBadRequest("Invalid Token")),
        };
    }
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct LogoutRequest {
    /// The refresh token
    pub refresh_token: String,
}

/// Put the refresh token in the invalidated list
#[post("/logout")]
pub async fn logout(
    redis_client: web::Data<RedisClient>,
    third_eye_server_config: web::Data<ThirdEyeServerConfig>,
    logout_request: web::Json<LogoutRequest>,
) -> Result<impl Responder> {
    let http_server_config = &third_eye_server_config.http_server_config;
    let refresh_token_expiry_time = http_server_config.refresh_token_expiry_time;
    let refresh_token_key = http_server_config
        .refresh_token_key
        .as_ref()
        .context("Refresh Token Key Not Available")
        .unwrap();

    let decoding_key = DecodingKey::from_base64_secret(refresh_token_key)
        .context("Not a valid Refresh Token Key")
        .unwrap();

    let refresh_token = &logout_request.0.refresh_token;
    let validation = Validation::default();
    let mut redis_con = match redis_client.client.get_connection() {
        Ok(con) => con,
        Err(err) => {
            log::error!("Failed to connect to Redis: {err:?}");
            return Err(error::ErrorInternalServerError("Internal Server Error"));
        }
    };

    // first we'll check if the refresh token is in the invalidated list or not
    if redis::Cmd::exists(refresh_token)
        .query(&mut redis_con)
        .unwrap()
    {
        Err(error::ErrorBadRequest("Token already considered invalid"))
    } else {
        match decode::<RefreshTokenClaim>(refresh_token, &decoding_key, &validation) {
            Ok(_) => {
                return match redis::cmd("SET")
                    .arg(refresh_token)
                    .arg(0)
                    .arg("EX")
                    .arg(refresh_token_expiry_time * 60)
                    .query::<()>(&mut redis_con)
                {
                    Ok(_) => Ok(HttpResponse::Ok().body("Logged out")),
                    Err(err) => {
                        log::error!(
                            "Error in invalidating the refresh token {refresh_token} | ${err:?}"
                        );
                        return Err(error::ErrorInternalServerError("Internal Server Error"));
                    }
                };
            }
            Err(_) => Err(error::ErrorBadRequest("Invalid Token")),
        }
    }
}
