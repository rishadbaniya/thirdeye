use actix_web::{post, get, delete, put, Responder, web, HttpResponse,  HttpRequest, Result, error};
use futures::StreamExt;
use mongodb::bson::{Document, doc, Bson};
use crate::{db::MongoDBClient};
use serde::{Deserialize, Serialize};
use mongodb::options::FindOptions;
use crate::utils::PasswordHasherHandler;


#[derive(Serialize, Deserialize)]
pub struct NewGroup {
    /// The unique name of the group
    pub groupName: String,
    
    /// The google map coordinates of the deployment group
    pub location : String,
    
    /// The district of deployment group
    pub district : String,
    
    /// The street address of the deployment group
    pub streetAddress : String,
    
    /// Total no of devices that belongs to this group
    #[serde(default = "default_no_of_devices")]
    pub noOfDevices : Option<i32>,

    /// All devices that belong to this group
    #[serde(default = "default_devices")]
    pub devices : Option<Vec<String>>
}

fn default_no_of_devices() -> Option<i32> { Some(0) }
fn default_devices() -> Option<Vec<String>> { Some(vec![]) }

#[derive(Serialize, Deserialize)]
pub struct Updatedgroup{
    /// The unique name of the group
    pub groupName: String,
    
    /// The google map coordinates of the deployment group
    pub location : String,
    
    /// The district of deployment group
    pub district : String,
    
    /// The street address of the deployment group
    pub streetAddress : String,
}

//impl Into<mongodb::bson::Document> for Updatedgroup{
//   fn into(self) -> mongodb::bson::Document {
//        let mut doc = doc! {};
//
//        macro_rules! insert_if_some {
//            ($field:ident) => {
//                if let Some(ref field) = self.$field {
//                    doc.insert(stringify!($field), field);
//                }
//            };
//        }
//
//        insert_if_some!(fullName);
//        insert_if_some!(email);
//        insert_if_some!(password);
//        insert_if_some!(imageUrl);
//    
//        doc
//    }
//}
//
#[derive(Serialize, Deserialize)]
pub struct Group {
    /// The unique name of the group
    pub groupName: String,
    
    /// The google map coordinates of the deployment group
    pub location : String,
    
    /// The district of deployment group
    pub district : String,
    
    /// The street address of the deployment group
    pub streetAddress : String,
    
    /// Total no of devices that belongs to this group
    pub noOfDevices : i32,

    /// All devices that belong to this group
    pub devices : Vec<String>
}

#[derive(Serialize, Deserialize)]
pub struct AllGroups{
    /// Data of all groups
    data : Vec<Group>,
    
    /// Total no of groups
    count : i32
}

//use mongodb::bson::Bson;

#[post("/group")]
pub async fn create_group(mongodb_client: web::Data<MongoDBClient>, new_group: web::Json<NewGroup>) -> Result<impl Responder>{
    let mut new_group = new_group.0;

    // If NewGroup provides noOfDevices or devices then we should set it to default
    // despite someone trying to set it's value
    new_group.noOfDevices = default_no_of_devices();
    new_group.devices = default_devices();

    let db = &mongodb_client.database;
    let groups_collection = db.collection::<NewGroup>("groups");

    let group_filter_option = doc! {
        "groupName" : &new_group.groupName
    };

   match groups_collection.find_one(group_filter_option, None).await {
       Ok(Some(_)) => {
            Err(error::ErrorConflict("Group already exists"))
       }
       Ok(None) => {
            match groups_collection.insert_one(new_group, None).await.unwrap().inserted_id {
               Bson::ObjectId(id) => Ok(HttpResponse::Ok().body(id.to_string())),
               _ => Ok(HttpResponse::InternalServerError().body("Failed to insert into the database"))
           }
       }
       Err(err) => {
            log::error!("Database Error | ${err:?}");
            Err(error::ErrorInternalServerError("Internal Server Error"))
       }
   } 
}

#[derive(Debug, Deserialize)]
struct PaginationParams{
    perPage : Option<u32>,
    page : Option<u32>
}

#[get("/groups")]
pub async fn get_groups(mongodb_client: web::Data<MongoDBClient>, req : HttpRequest) -> Result<impl Responder> {
    let db = &mongodb_client.database;
    let groups_collection = db.collection::<Group>("groups");

    let (page, per_page) = match web::Query::<PaginationParams>::from_query(req.query_string()){
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
    let group_find_options = FindOptions::builder().limit(per_page as i64).skip(skip as u64).build();

    match groups_collection.find(None, Some(group_find_options)).await {
       Ok(mut cursor) => {
            let mut groups = Vec::new();
            while let Some(v) = cursor.next().await{
                groups.push(v.map_err(|err|{
                    log::error!("Error while parsing to group type probably | {err:?}");
                    error::ErrorInternalServerError("Couldn't retrieve some groups") 
                })?);
            }
            let count = groups_collection.count_documents(None, None).await.map_err(|err| {
                log::error!("Database Error while trying to count total no of groups| ${err:?}");
                error::ErrorInternalServerError("Coudln't count total no of groups") 
            })? as i32;

            Ok(web::Json(AllGroups{
                data : groups,
                count
            }))
        }
        Err(err) => {
            log::error!("Database Error | ${err:?}");
            Err(error::ErrorInternalServerError("Internal Server Error"))
        }
    }
}

#[get("/group/{group_name}")]
pub async fn get_group(
    mongodb_client: web::Data<MongoDBClient>,
    path : web::Path<String>
) -> impl Responder{
    let group_name = path.into_inner();

    let db = &mongodb_client.database;
    let groups_collection = db.collection::<Group>("groups");

    let group_filter_option = doc! {
        "groupName" : &group_name
    };

    match groups_collection.find_one(group_filter_option, None).await {
        Ok(Some(group)) => Ok(web::Json(group)),
        Ok(None) => Err(error::ErrorNotFound("Group not found")),
        Err(err) => {
            log::error!("Database Error | ${err:?}");
            Err(error::ErrorInternalServerError("Internal Server Error"))
        }
    }
}

// TODO: Delete the Device too
#[delete("/group/{group_name}")]
pub async fn delete_group(
    mongodb_client: web::Data<MongoDBClient>,
    path : web::Path<String>
) -> Result<impl Responder> {
    let group_name = path.into_inner();

    let db = &mongodb_client.database;
    let groups_collection = db.collection::<Group>("groups");
    //let devices_collection = db.collection::<>(name)

    let group_filter_option = doc! {
        "groupName" : &group_name
    };
    
    let handle_db_error = |err|{
        log::error!("Database Error | ${err:?}");
        error::ErrorInternalServerError("Internal Server Error")
    };
    
    let result = groups_collection.delete_one(group_filter_option, None).await.map_err(handle_db_error)?;

    if result.deleted_count == 1 {
        Ok(HttpResponse::Ok().body("group deleted successfully"))
    } else {
        Err(error::ErrorNotFound("group not found"))
    }
}

//#[put("/group/{email}")]
//pub async fn update_group(
//    mongodb_client: web::Data<MongoDBClient>,
//    path: web::Path<String>,
//    updated_group: web::Json<Updatedgroup>,
//) -> Result<impl Responder> {
//    let email = path.into_inner();
//    let mut updated_group = updated_group.into_inner();
//
//    let db = &mongodb_client.database;
//    let groups_collection = db.collection::<Updatedgroup>("groups");
//
//    // Check if the updated email is different from the current email
//    if let Some(ref updated_group_email)  = updated_group.email{
//        if email != *updated_group_email {
//            let existing_group_filter_option = doc! {
//                "email": updated_group_email
//            };
//            
//            let handle_db_error = |err|{
//                log::error!("Database Error | ${err:?}");
//                error::ErrorInternalServerError("Internal Server Error")
//            };
//
//            // Check if another group already exists with the updated email
//            if groups_collection.find_one(existing_group_filter_option, None).await.map_err(handle_db_error)?.is_some() {
//                return Err(error::ErrorConflict("Another group already exists with the updated email"));
//            }
//        }
//    }
//
//    let group_filter_option = doc! {
//        "email" : &email
//    };
//    
//    if let Some(ref updated_group_password) = updated_group.password{
//        updated_group.password = Some(PasswordHasherHandler::hash(updated_group_password.as_bytes()));
//    }
//    let update_group : Document = updated_group.into();
//    let update = doc! { "$set": update_group};
//
//    match groups_collection.update_one(group_filter_option, update, None).await {
//        Ok(result) => {
//            if result.modified_count == 1 {
//                Ok(HttpResponse::Ok().body("group updated successfully"))
//            } else {
//                Err(error::ErrorNotFound("group not found"))
//            }
//        }
//        Err(err) => {
//            log::error!("Database Error | ${err:?}");
//            Err(error::ErrorInternalServerError("Internal Server Error"))
//        }
//    }
//}
//
