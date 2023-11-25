use crate::db::MongoDBClient;
use crate::utils::PasswordHasherHandler;
use actix_web::{delete, error, get, post, put, web, HttpRequest, HttpResponse, Responder, Result};
use futures::StreamExt;
use mongodb::bson::{doc, Document};
use mongodb::options::FindOptions;
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize)]
pub struct NewUser {
    /// Full name of the user
    pub fullName: String,

    /// The email of the user that's used for login
    pub email: String,

    /// The argon2 hashed password
    pub password: String,

    /// The url of the image of the user
    pub imageUrl: Option<String>,
}

#[derive(Serialize, Deserialize)]
pub struct UpdatedUser {
    /// Full name of the user
    pub fullName: Option<String>,

    /// The email of the user that's used for login
    pub email: Option<String>,

    /// The argon2 hashed password
    pub password: Option<String>,

    /// The url of the image of the user
    pub imageUrl: Option<String>,
}

impl Into<mongodb::bson::Document> for UpdatedUser {
    fn into(self) -> mongodb::bson::Document {
        let mut doc = doc! {};

        macro_rules! insert_if_some {
            ($field:ident) => {
                if let Some(ref field) = self.$field {
                    doc.insert(stringify!($field), field);
                }
            };
        }

        insert_if_some!(fullName);
        insert_if_some!(email);
        insert_if_some!(password);
        insert_if_some!(imageUrl);

        doc
    }
}

#[derive(Serialize, Deserialize)]
pub struct User {
    /// Full name of the user
    pub fullName: String,

    /// The email of the user that's used for login
    pub email: String,

    /// The url of the image of the user
    pub imageUrl: Option<String>,
}

#[derive(Serialize, Deserialize)]
pub struct AllUsers {
    /// Data of all users
    data: Vec<User>,

    /// Total no of Users
    count: i32,
}

use mongodb::bson::Bson;

#[post("/user")]
pub async fn create_user(
    mongodb_client: web::Data<MongoDBClient>,
    new_user: web::Json<NewUser>,
) -> Result<impl Responder> {
    let mut new_user = new_user.0;
    let db = &mongodb_client.database;
    let users_collection = db.collection::<NewUser>("users");

    let user_filter_option = doc! {
        "email" : &new_user.email
    };

    match users_collection.find_one(user_filter_option, None).await {
        Ok(Some(_)) => Err(error::ErrorConflict("User already exists")),
        Ok(None) => {
            let hashed_password = PasswordHasherHandler::hash(new_user.password.as_bytes());
            new_user.password = hashed_password;

            match users_collection
                .insert_one(new_user, None)
                .await
                .unwrap()
                .inserted_id
            {
                Bson::ObjectId(id) => Ok(HttpResponse::Ok().body(id.to_string())),
                _ => {
                    Ok(HttpResponse::InternalServerError()
                        .body("Failed to insert into the database"))
                }
            }
        }
        Err(err) => {
            log::error!("Database Error | ${err:?}");
            Err(error::ErrorInternalServerError("Internal Server Error"))
        }
    }
}

#[derive(Debug, Deserialize)]
struct PaginationParams {
    perPage: Option<u32>,
    page: Option<u32>,
}

#[get("/users")]
pub async fn get_users(
    mongodb_client: web::Data<MongoDBClient>,
    req: HttpRequest,
) -> Result<impl Responder> {
    let db = &mongodb_client.database;
    let users_collection = db.collection::<User>("users");

    let (page, per_page) = match web::Query::<PaginationParams>::from_query(req.query_string()) {
        Ok(pagination_params) => {
            let pagination_params = pagination_params.into_inner();
            let page = pagination_params.page.unwrap_or(1);
            let perPage = pagination_params.perPage.unwrap_or(10);
            (page, perPage)
        }
        Err(_) => {
            return Err(error::ErrorBadRequest("Invalid Query"));
        }
    };
    let skip = (page - 1) * per_page;
    let user_find_options = FindOptions::builder()
        .limit(per_page as i64)
        .skip(skip as u64)
        .build();

    match users_collection.find(None, Some(user_find_options)).await {
        Ok(mut cursor) => {
            let mut users = Vec::new();
            while let Some(v) = cursor.next().await {
                users.push(v.map_err(|err| {
                    log::error!("Error while parsing to User type probably | {err:?}");
                    error::ErrorInternalServerError("Couldn't retrieve some users")
                })?);
            }
            let count = users_collection
                .count_documents(None, None)
                .await
                .map_err(|err| {
                    log::error!("Database Error while trying to count total no of users| ${err:?}");
                    error::ErrorInternalServerError("Coudln't count total no of users")
                })? as i32;

            Ok(web::Json(AllUsers { data: users, count }))
        }
        Err(err) => {
            log::error!("Database Error | ${err:?}");
            Err(error::ErrorInternalServerError("Internal Server Error"))
        }
    }
}

#[get("/user/{email}")]
pub async fn get_user(
    mongodb_client: web::Data<MongoDBClient>,
    path: web::Path<String>,
) -> impl Responder {
    let email = path.into_inner();

    let db = &mongodb_client.database;
    let users_collection = db.collection::<User>("users");

    let user_filter_option = doc! {
        "email" : email
    };

    match users_collection.find_one(user_filter_option, None).await {
        Ok(Some(user)) => Ok(web::Json(user)),
        Ok(None) => Err(error::ErrorNotFound("User not found")),
        Err(err) => {
            log::error!("Database Error | ${err:?}");
            Err(error::ErrorInternalServerError("Internal Server Error"))
        }
    }
}

#[delete("/user/{email}")]
pub async fn delete_user(
    mongodb_client: web::Data<MongoDBClient>,
    path: web::Path<String>,
) -> Result<impl Responder> {
    let email = path.into_inner();

    let db = &mongodb_client.database;
    let users_collection = db.collection::<User>("users");

    let user_filter_option = doc! {
        "email" : email
    };

    let handle_db_error = |err| {
        log::error!("Database Error | ${err:?}");
        error::ErrorInternalServerError("Internal Server Error")
    };

    let result = users_collection
        .delete_one(user_filter_option, None)
        .await
        .map_err(handle_db_error)?;

    if result.deleted_count == 1 {
        Ok(HttpResponse::Ok().body("User deleted successfully"))
    } else {
        Err(error::ErrorNotFound("User not found"))
    }
}

#[put("/user/{email}")]
pub async fn update_user(
    mongodb_client: web::Data<MongoDBClient>,
    path: web::Path<String>,
    updated_user: web::Json<UpdatedUser>,
) -> Result<impl Responder> {
    let email = path.into_inner();
    let mut updated_user = updated_user.into_inner();

    let db = &mongodb_client.database;
    let users_collection = db.collection::<UpdatedUser>("users");

    // Check if the updated email is different from the current email
    if let Some(ref updated_user_email) = updated_user.email {
        if email != *updated_user_email {
            let existing_user_filter_option = doc! {
                "email": updated_user_email
            };

            let handle_db_error = |err| {
                log::error!("Database Error | ${err:?}");
                error::ErrorInternalServerError("Internal Server Error")
            };

            // Check if another user already exists with the updated email
            if users_collection
                .find_one(existing_user_filter_option, None)
                .await
                .map_err(handle_db_error)?
                .is_some()
            {
                return Err(error::ErrorConflict(
                    "Another user already exists with the updated email",
                ));
            }
        }
    }

    let user_filter_option = doc! {
        "email" : &email
    };

    if let Some(ref updated_user_password) = updated_user.password {
        updated_user.password = Some(PasswordHasherHandler::hash(
            updated_user_password.as_bytes(),
        ));
    }
    let update_user: Document = updated_user.into();
    let update = doc! { "$set": update_user};

    match users_collection
        .update_one(user_filter_option, update, None)
        .await
    {
        Ok(result) => {
            if result.modified_count == 1 {
                Ok(HttpResponse::Ok().body("User updated successfully"))
            } else {
                Err(error::ErrorNotFound("User not found"))
            }
        }
        Err(err) => {
            log::error!("Database Error | ${err:?}");
            Err(error::ErrorInternalServerError("Internal Server Error"))
        }
    }
}
