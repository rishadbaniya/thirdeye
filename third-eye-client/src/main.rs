#![allow(unused_imports, unused_variables, unused)]

use std::sync::Arc;
use std::time::Duration;
use tokio::join;
use tokio::sync::RwLock;
use clap::Parser;

use sysinfo::{CpuExt, System, SystemExt};

mod args;
mod config;

pub mod data_exchange {
    tonic::include_proto!("data_exchange");
}

use data_exchange::data_exchange_service_client::DataExchangeServiceClient;
use data_exchange::{Command, CommandRequest, CommandResponse, SysInfo, SysInfoConfig};

use config::ThirdEyeClientConfig;
use tonic::transport::Channel;
use tonic::Request;
use args::Args;

pub struct ThirdEyeClient {
    /// The configuration for the [ThirdEyeClient]
    config: ThirdEyeClientConfig,

    /// Hold the system information
    system: Arc<RwLock<sysinfo::System>>,

    /// About cloning the client, please look at: https://github.com/hyperium/tonic/issues/33
    client: DataExchangeServiceClient<Channel>,
}

impl ThirdEyeClient {
    pub async fn new(config : ThirdEyeClientConfig) -> Self {
        let mut client = DataExchangeServiceClient::connect(config.address.clone()).await.unwrap();
        let system = Arc::new(RwLock::new(System::new()));

        Self{
            config,
            system,
            client
        }
    }

    pub async fn initiate_data_exchange(&self) {
        let send_sys_info = self.send_sys_info();
        let get_command = self.get_command();

        join!(send_sys_info
        //, get_command
    );
    }

    async fn send_sys_info(&self) {
        let mut client = self.client.clone();
        let system = self.system.clone();
        let sys_info_config = Arc::new(RwLock::new(SysInfoConfig{ interval: 5 }));

        let _sys_info_config = sys_info_config.clone();
        let id = self.config.id.clone();
        let outbound = async_stream::stream! {
            loop{

                let sys_info = {
                    let mut system_w = system.write().await;
                    system_w.refresh_all();

                    let id = id.clone();
                    let cpu_cores = system_w.cpus().iter().len() as u32;
                    let cpu_frequency = system_w.global_cpu_info().frequency() as u32;
                    let cpu_brand = system_w.global_cpu_info().brand().to_string();
                    let memory_size = system_w.total_memory() as u32;
                    let memory_available = system_w.available_memory() as u32;
                    let memory_used = system_w.used_memory() as u32;
                    let uptime = system_w.uptime() as u32;

                    SysInfo{
                        id,
                        cpu_cores,
                        cpu_frequency,
                        memory_size,
                        memory_used,
                        memory_available,
                        cpu_brand,
                        uptime
                    }
                };

                let sleep_duration = {
                    let sys_info_config_r = sys_info_config.read().await;
                    sys_info_config_r.interval as u64
                };

               yield sys_info;

               tokio::time::sleep(Duration::from_secs(sleep_duration)).await;
            }
        };

        let resp = client.send_sys_info(Request::new(outbound)).await.unwrap();
        let mut inbound = resp.into_inner();

        while let Some(new_sys_info_config) = inbound.message().await.unwrap() {
            let mut sys_info_config_w = _sys_info_config.write().await;
            *sys_info_config_w = new_sys_info_config;
        }
    }

    async fn get_command(&self) {
        let mut client = self.client.clone();
        let (cr_sd, mut cr_rv) = tokio::sync::mpsc::channel::<CommandRequest>(1);

        let outbound = async_stream::stream! {
            while let Some(command_req) = cr_rv.recv().await {
                let x = command_req.command();
                // do thigns with command here
                let command_resp = CommandResponse{
                    response : String::from("RECEIVED A COMMAND")
                };
                yield command_resp;
            }
        };

        let resp = client.get_command(Request::new(outbound)).await.unwrap();
        let mut inbound = resp.into_inner();

        while let Some(command_req) = inbound.message().await.unwrap() {
            cr_sd.send(command_req);
        }
    }

    async fn execute_command(&self) {}
}

#[tokio::main]
async fn main() -> anyhow::Result<()>{
    let args = Args::parse();

    let third_eye_client_config = ThirdEyeClientConfig::from_config_file(&args)?;
    let third_eye_client = ThirdEyeClient::new(third_eye_client_config).await;

    third_eye_client.initiate_data_exchange().await;
    Ok(())
}
