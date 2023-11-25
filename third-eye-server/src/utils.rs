use argon2::{
    password_hash::{rand_core::OsRng, PasswordHasher, SaltString},
    Argon2, Params, PasswordHash, PasswordVerifier,
};
use std::str;

pub struct PasswordHasherHandler;

impl PasswordHasherHandler {
    /// Takes the actual password and gets the hash, this hash is basically the combination of
    /// (salt + hash) i.e salt is stored already on this and we don't need to store it somewhere
    /// else explicitly
    pub fn hash(password: &[u8]) -> String {
        let salt = SaltString::generate(&mut OsRng);

        let argon2_params = Params::new(24 * 1024, 2, 1, Some(16)).unwrap();
        let argon2 = Argon2::new(argon2::Algorithm::Argon2id, argon2::Version::V0x13, argon2_params);
        let password_hash = argon2.hash_password(password, &salt).unwrap().to_string();

        password_hash
    }

    /// Takes the actual password and the hash we believe belongs to actual password
    pub fn verify(password: &[u8], hash: &str) -> bool {
        let argon2_params = Params::new(24 * 1024, 2, 1, Some(16)).unwrap();
        let argon2 = Argon2::new(argon2::Algorithm::Argon2id, argon2::Version::V0x13, argon2_params);

        if let Ok(parsed_hash) = PasswordHash::new(hash) {
            return argon2.verify_password(password, &parsed_hash).is_ok();
        }
        return false;
    }
}
