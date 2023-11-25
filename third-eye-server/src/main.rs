#![allow(non_camel_case_types, non_snake_case)]


pub mod data_exchange {
    tonic::include_proto!("data_exchange");
}
mod args;
mod config;
mod db;
mod http;
mod utils;

use std::sync::Arc;
use std::time::{SystemTime, UNIX_EPOCH};
use std::{path::PathBuf, env, thread, pin::Pin, future};
use actix_web::web::Data;
use actix_web::{HttpServer, App};
use config::ThirdEyeServerConfig;
use db::MongoDBClient;

use args::Args;
use clap::Parser;
use futures::StreamExt;
use futures::stream::Stream;
use data_exchange::data_exchange_service_server::{DataExchangeService, DataExchangeServiceServer};
use data_exchange::{CommandRequest, SysInfoConfig, SysInfo};
use http::server::run_http_server;
use log::info;
use tokio::{join, try_join};
use tokio::task::{self, JoinHandle};
use mongodb::bson::{self, doc, Document, Bson};

use serde::{Deserialize, Serialize}; use tonic::transport::Server;
struct ThirdEyeServer{
    /// The configuration to run [ThirdEyeServer]
    third_eye_server_config : Arc<ThirdEyeServerConfig>,

    /// The [MongoDBClient] which acts as a global persistent state for both gRPC server and http
    /// server
    mongodb_client: Arc<MongoDBClient>,
}

impl ThirdEyeServer{
    pub async fn new(config : Arc<ThirdEyeServerConfig>)-> anyhow::Result<Self>{
        let third_eye_server_config = config;
        let mongodb_client = Arc::new(MongoDBClient::new(third_eye_server_config.mongodb_config.as_ref().unwrap()).await?);

       Ok(Self { third_eye_server_config, mongodb_client})
    }
    
    /// Runs the Http Server as defined in the [config::HttpServerConfig]
    async fn run_http_server(&self) -> anyhow::Result<()>{
        let mongodb_client = self.mongodb_client.clone();
        let http_server_config = self.third_eye_server_config.http_server_config.clone();
        run_http_server(mongodb_client, http_server_config).await
    }
    
    /// Runs the gRPC Server as defined in [config::gRPCServerConfig]
    async fn run_grpc_server(&self) -> anyhow::Result<()>{
        let mongodb_client = self.mongodb_client.clone();
        let third_eye_grpc_service = ThirdEyeGRPCService{
            mongodb_client
        };

        let service = DataExchangeServiceServer::new(third_eye_grpc_service);
        let mut server = Server::builder();
        server.add_service(service).serve("0.0.0.0:8080".parse()?).await?;
        Ok(())
        // TODO : log if the the grpc server fails
    }
    
    /// Runs both gRPC server and HTTP Server
    pub async fn run(self){
        let run_http_server = {
            self.run_http_server()
        };

        let run_grpc_server = {
            self.run_grpc_server()
        };
    
        if let Err(err) = try_join!(run_http_server, run_grpc_server){
            log::error!("ThirdEyeServer failed! {err:?}");
            panic!("ThirdEyeServer failed");
        }
    }
}

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    let args = Args::parse();

    log4rs::init_file(args.log_config.clone(), Default::default())?;
    info!("Loading the environment variables from {}", args.env);

   let third_eye_server_config = Arc::new(ThirdEyeServerConfig::from_env_and_config_file(&args)?);

    // TODO: Don't log the password and other credentials on the log file, ailelai it's easier so
    // allowed in development
    info!("Current configs set to {third_eye_server_config:#?}");

    ThirdEyeServer::new(third_eye_server_config).await?.run().await;

  Ok(()) 
}

struct ThirdEyeGRPCService{
    mongodb_client : Arc<MongoDBClient>
}

#[tonic::async_trait]
impl DataExchangeService for ThirdEyeGRPCService {

    type getCommandStream = Pin<Box<dyn Stream<Item = Result<CommandRequest, tonic::Status>> + Send  + 'static>>;

    async fn get_command(&self,request:tonic::Request<tonic::Streaming<data_exchange::CommandResponse>>,) -> std::result::Result<tonic::Response<Self::getCommandStream>,tonic::Status> {
        todo!()
    }

    type sendSysInfoStream = Pin<Box<dyn Stream<Item = Result<SysInfoConfig, tonic::Status>> + Send  + 'static>>;
    
    async fn send_sys_info(&self,request:tonic::Request<tonic::Streaming<data_exchange::SysInfo>>,) -> std::result::Result<tonic::Response<Self::sendSysInfoStream>,tonic::Status, > {
        let mongodb_client = self.mongodb_client.clone();

        let deployment_devices = mongodb_client.database.collection::<DeploymentDevice>("deployment_devices");

        let mut incoming  = request.into_inner();
        let outgoing = async_stream::try_stream! {
            while let Some(Ok(sys_info)) = incoming.next().await{
                let group_name = &sys_info.group_name;
                let device_name = &sys_info.device_name;
                    
                let deployment_device_filter = bson::doc!{
                    "groupName" : group_name,
                    "deviceName" : device_name
                };
                

               let deployment_device_info = DeploymentDeviceInformation::fromSysInfo(sys_info);
                let deployment_device_update = bson::doc!{
                    "$push": { 
                        "devices": deployment_device_info
                    }
                };

                match deployment_devices.update_one(deployment_device_filter, deployment_device_update, None).await {
                    Ok(xx) => {
                    }
                    Err(ee) => {
                    }
                };
            }

            yield SysInfoConfig{
                interval : 20
            };
        };

        Ok(tonic::Response::new(Box::pin(outgoing) as Self::sendSysInfoStream))
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct DeploymentGroup{
    /// The unique name of the deployment group
    pub groupName : String,

    /// Total no of devices
    pub noOfDevices: u16,

    /// All the devices asssociated with this group
    pub devices : Vec<String>
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct DeploymentDevice{
    /// The unique name of the deployment group that this [DeploymentDevice] belongs to
    pub groupName : String,

    /// The unique name of the [DeploymentDevice]
    pub deviceName : String,
    
    /// The system information of the device over time
    pub sys_info : Vec<DeploymentDeviceInformation>,
    
    /// The configuration for getting system information 
    pub sys_info_config : DeploymentDeviceInformationConfig
    
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct DeploymentDeviceInformation{
    /// The epoch time at which the information came
    pub time : i32,

    pub cpu_cores: u32,

    pub cpu_frequency: u32,

    pub cpu_brand: String,

    pub memory_size: u32,

    pub memory_available: u32,

    pub memory_used: u32,

    pub uptime: u32,
}

impl DeploymentDeviceInformation{
    /// Build [DeploymentDeviceInformation] from [SysInfo]
    pub fn fromSysInfo(sys_info :SysInfo) -> Self{
        let time = SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_secs() as i32;
        let cpu_cores = sys_info.cpu_cores;
        let cpu_frequency = sys_info.cpu_frequency;
        let cpu_brand = sys_info.cpu_brand;
        let memory_size = sys_info.memory_size;
        let memory_available = sys_info.memory_available;
        let memory_used = sys_info.memory_used;
        let uptime = sys_info.uptime;

        Self { 
            time,
            cpu_cores,
            cpu_frequency,
            cpu_brand,
            memory_size,
            memory_available,
            memory_used,
            uptime
        }
    }
}

impl From<DeploymentDeviceInformation> for Bson{
    fn from(value: DeploymentDeviceInformation) -> Self {
        bson::to_bson(&value).unwrap()
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct DeploymentDeviceInformationConfig{
    /// The interval at which the device should send data
    pub interval : i32
}

impl From<DeploymentDeviceInformationConfig> for Bson{
    fn from(value: DeploymentDeviceInformationConfig) -> Self {
        bson::to_bson(&value).unwrap()
    }
}

