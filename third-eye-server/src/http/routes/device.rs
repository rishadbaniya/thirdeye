use crate::utils::PasswordHasherHandler;
use crate::utils::PasswordHasherHandler;
use crate::{db::MongoDBClient, DeploymentDeviceInformation};
use actix_web::{
    delete, dev, error, get, post, put, web, HttpRequest, HttpResponse, Responder, Result,
};
use futures::StreamExt;
use mongodb::bson::{doc, Bson, Document};
use mongodb::options::FindOptions;
use mongodb::options::FindOptions;
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Debug)]
pub struct NewDevice {
    /// The unique name of the device
    pub deviceName: String,

    /// The unique name of the group
    pub groupName: String,

    /// The information over time
    #[serde(default = "default_information")]
    information: Option<Vec<DeploymentDeviceInformation>>,
}

fn default_information() -> Option<Vec<DeploymentDeviceInformation>> {
    Some(Vec::new())
}

#[post("/device")]
pub async fn create_device(
    mongodb_client: web::Data<MongoDBClient>,
    new_device: web::Json<NewDevice>,
) -> Result<impl Responder> {
    let mut new_device = new_device.0;

    // If NewUser provides information then we should set it to default despite someone trying to set it's value
    new_device.information = default_information();

    let db = &mongodb_client.database;
    let devices_collection = db.collection::<NewDevice>("devices");

    let group_filter_option = doc! {
        "deviceName" : &new_device.deviceName,
        "groupName" : &new_device.groupName
    };

    match devices_collection.find_one(group_filter_option, None).await {
        Ok(Some(_)) => Err(error::ErrorConflict("Group already exists")),
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
