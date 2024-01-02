use std::str::FromStr;

use crate::utils::PasswordHasherHandler;
use crate::utils::_id_mongodb_serializer;
use crate::{db::MongoDBClient, DeploymentDeviceInformation};
use actix_web::http::header::ContentType;
use actix_web::{
    delete, dev, error, get, post, put, web, HttpRequest, HttpResponse, Responder, Result,
};
use futures::StreamExt;
use mongodb::bson::oid::ObjectId;
use mongodb::bson::{doc, Bson, Document};
use mongodb::options::FindOptions;
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Debug)]
pub struct NewDevice {
    /// The unique ID of the device
    pub device_id: String,

    /// The local address of the deployment
    pub address: String,

    /// The longitude of deployment
    pub longitude: f32,

    /// The latitude of deployment
    pub latitude: f32,

    /// The information over time
    #[serde(default = "default_resource")]
    resource: Option<Vec<Resource>>,
}

fn default_resource() -> Option<Vec<Resource>> {
    Some(Vec::new())
}

#[derive(Serialize, Deserialize, Debug)]
pub struct Device {
    /// The unique id of the group
    #[serde(serialize_with = "_id_mongodb_serializer", rename(serialize = "id"))]
    pub _id: ObjectId,

    /// The unique ID of the device
    pub device_id: String,

    /// The local address of the deployment
    pub address: String,

    /// The longitude of deployment
    pub longitude: f32,

    /// The latitude of deployment
    pub latitude: f32,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct ADevice {
    /// The unique id of the group
    #[serde(serialize_with = "_id_mongodb_serializer", rename(serialize = "id"))]
    pub _id: ObjectId,

    /// The unique ID of the device
    pub device_id: String,

    /// The local address of the deployment
    pub address: String,

    /// The longitude of deployment
    pub longitude: f32,

    /// The latitude of deployment
    pub latitude: f32,

    /// The information over time
    resource: Vec<DeploymentDeviceInformation>,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct Resource {
    /// The number of CPU cores
    pub cpu_cores: u32,

    /// The CPU frequency
    pub cpu_frequency: u32,

    /// The CPU brand
    pub cpu_brand: String,

    /// The total memory size
    pub memory_size: u32,

    /// The total memory available
    pub memory_available: u32,

    /// The total memory used
    pub memory_used: u32,

    /// The system uptime
    pub uptime: u32,
}

#[post("/devices")]
pub async fn create_device(
    mongodb_client: web::Data<MongoDBClient>,
    new_device: web::Json<NewDevice>,
) -> Result<impl Responder> {
    let mut new_device = new_device.0;
    let db = &mongodb_client.database;
    let devices_collection = db.collection::<NewDevice>("devices");

    let device_filter_option = doc! {
        "device_id" : &new_device.device_id
    };

    match devices_collection
        .find_one(device_filter_option, None)
        .await
    {
        Ok(Some(_)) => Err(error::ErrorConflict("Device already exists")),
        Ok(None) => {
            match devices_collection
                .insert_one(new_device, None)
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

#[derive(Serialize, Deserialize)]
pub struct AllDevice {
    /// Data of all users
    data: Vec<Device>,

    /// Total no of Users
    total: i32,
}

#[derive(Debug, Deserialize)]
struct PaginationParams {
    perPage: Option<u32>,
    page: Option<u32>,
}

#[get("/devices")]
pub async fn get_devices(
    mongodb_client: web::Data<MongoDBClient>,
    req: HttpRequest,
) -> Result<impl Responder> {
    println!("THE REQUEST GOT HERE");
    let db = &mongodb_client.database;
    let devices_collection = db.collection::<Device>("devices");

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
    let device_find_options = FindOptions::builder()
        .limit(per_page as i64)
        .skip(skip as u64)
        .build();

    match devices_collection
        .find(None, Some(device_find_options))
        .await
    {
        Ok(mut cursor) => {
            let mut users = Vec::new();
            while let Some(v) = cursor.next().await {
                users.push(v.map_err(|err| {
                    log::error!("Error while parsing to User type probably | {err:?}");
                    error::ErrorInternalServerError("Couldn't retrieve some users")
                })?);
            }
            let total = devices_collection
                .count_documents(None, None)
                .await
                .map_err(|err| {
                    log::error!("Database Error while trying to count total no of users| ${err:?}");
                    error::ErrorInternalServerError("Coudln't count total no of users")
                })? as i32;

            Ok(web::Json(AllDevice { data: users, total }))
        }
        Err(err) => {
            log::error!("Database Error | ${err:?}");
            Err(error::ErrorInternalServerError("Internal Server Error"))
        }
    }
}

#[get("/devices/{id}")]
pub async fn get_device(
    mongodb_client: web::Data<MongoDBClient>,
    path: web::Path<String>,
) -> impl Responder {
    let id = path.into_inner();

    let db = &mongodb_client.database;
    let devices_collection = db.collection::<ADevice>("devices");

    let pipeline = vec![
        doc! {
            "$match": {
                "_id": ObjectId::from_str(&id).unwrap(),
            },
        },
        doc! {
            "$project": {
                "_id" :1,
                "device_id" :1,
                "address" :1,
                "longitude" :1,
                "latitude" :1,
                "resource": { "$slice": ["$resource", -1] },
            },
        },
    ];

    let mut cursor = devices_collection.aggregate(pipeline, None).await.unwrap();
    let mut resource = vec![];
    for i in cursor.next().await {
        resource.push(i.unwrap());
    }
    if resource.len() == 0 {
        return HttpResponse::NotFound().body("Device not found");
    } else {
        let mut resource = resource[0].clone();
        let id = resource.get_object_id("_id").unwrap();
        resource.remove("_id").unwrap();
        resource.insert("id", id.to_string());
        return HttpResponse::Ok()
            .content_type(ContentType::json())
            .body(resource.to_string());
    }
}

#[delete("/devices/{id}")]
pub async fn delete_device(
    mongodb_client: web::Data<MongoDBClient>,
    path: web::Path<String>,
) -> Result<impl Responder> {
    let id = path.into_inner();

    let db = &mongodb_client.database;
    let devices_collection = db.collection::<Device>("devices");

    let user_filter_option = doc! {
        "_id" : ObjectId::from_str(&id).unwrap()
    };

    let handle_db_error = |err| {
        log::error!("Database Error | ${err:?}");
        error::ErrorInternalServerError("Internal Server Error")
    };

    let result = devices_collection
        .delete_one(user_filter_option, None)
        .await
        .map_err(handle_db_error)?;

    if result.deleted_count == 1 {
        Ok(HttpResponse::Ok().body("User deleted successfully"))
    } else {
        Err(error::ErrorNotFound("User not found"))
    }
}

// TODO: Support for Update
