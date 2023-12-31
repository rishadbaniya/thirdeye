use crate::args::Args;
use crate::data_exchange::SysInfoConfig;
use anyhow::{self, Context};
use serde::Deserialize;
use std::{fs::File, io::Read};

/// The configuration for EyeClient
#[derive(Debug, Deserialize, Clone)]
pub struct ThirdEyeClientConfig {
    /// The address of the gRPC EyeServer
    pub address: String,

    /// The unique id of the deployed computer
    pub id: String,
}

impl ThirdEyeClientConfig {
    pub fn from_config_file(args: &Args) -> anyhow::Result<Self> {
        let mut third_eye_client_config: ThirdEyeClientConfig = {
            let config_file_path = args.config.as_str();
            let mut config_file =
                File::open(config_file_path).context("The config file doesn't exist")?;
            let mut config_file_contents = String::new();
            config_file
                .read_to_string(&mut config_file_contents)
                .context("Error in reading the config file")?;

            toml::from_str(config_file_contents.as_str())?
        };

        Ok(third_eye_client_config)
    }
}
