use crate::data_exchange::SysInfoConfig;

/// The configuration for EyeClient
#[derive(Debug, Clone)]
pub struct ThirdEyeClientConfig {
    /// The address of the gRPC EyeServer
    pub address: String,

    /// The port of the EyeServer
    pub port: u16,

    /// The configuration to exchange the SysInfo
    pub sys_info_config: SysInfoConfig,
}
