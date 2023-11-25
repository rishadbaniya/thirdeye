use std::future::{ready, Ready};

use actix_web::{
    body::EitherBody,
    dev::{self, Service, ServiceRequest, ServiceResponse, Transform},
    Error, HttpResponse,
};
use futures_util::future::LocalBoxFuture;
use jsonwebtoken::{decode, DecodingKey, Validation};

use crate::http::routes::auth::AccessTokenClaim;

/// Authorize the incoming request
pub struct AuthReq;

impl<S, B> Transform<S, ServiceRequest> for AuthReq
where
    S: Service<ServiceRequest, Response = ServiceResponse<B>, Error = Error>,
    S::Future: 'static,
    B: 'static,
{
    type Response = ServiceResponse<EitherBody<B>>;

    type Error = Error;
    type InitError = ();
    type Transform = AuthReqMiddleware<S>;
    type Future = Ready<Result<Self::Transform, Self::InitError>>;
    fn new_transform(&self, service: S) -> Self::Future {
        ready(Ok(AuthReqMiddleware { service }))
    }
}
pub struct AuthReqMiddleware<S> {
    service: S,
}

impl<S, B> Service<ServiceRequest> for AuthReqMiddleware<S>
where
    S: Service<ServiceRequest, Response = ServiceResponse<B>, Error = Error>,
    S::Future: 'static,
    B: 'static,
{
    type Response = ServiceResponse<EitherBody<B>>;
    type Error = Error;
    type Future = LocalBoxFuture<'static, Result<Self::Response, Self::Error>>;

    dev::forward_ready!(service);

    fn call(&self, req: ServiceRequest) -> Self::Future {
        // we will allow /login, /refresh, /logout to be public because it should be accessible by everyone
        if req.path() != "/login" && req.path() == "/refresh" && req.path() != "/logout" {
            // TODO: Use key from the config
            let key = "81509f5b421b660da6cd707e262e73cf335080641fe51a76e747b153621af0b4";
            let decoding_key = DecodingKey::from_base64_secret(key).unwrap();

            return if let Some(token) = req.headers().get("Authorization") {
                let mut validation = Validation::default();
                validation.required_spec_claims.clear();
                match decode::<AccessTokenClaim>(
                    token.to_str().unwrap(),
                    &decoding_key,
                    &validation,
                ) {
                    Ok(_) => {
                        let res = self.service.call(req);
                        Box::pin(async move { res.await.map(ServiceResponse::map_into_left_body) })
                    }
                    Err(_) => Box::pin(async move {
                        Ok(req.into_response(
                            HttpResponse::Unauthorized()
                                .body("Invalid authorization credentials")
                                .map_into_right_body(),
                        ))
                    }),
                }
            } else {
                Box::pin(async move {
                    Ok(req.into_response(
                        HttpResponse::Unauthorized()
                            .body("No authorization credentials")
                            .map_into_right_body(),
                    ))
                })
            };
        }

        let res = self.service.call(req);
        Box::pin(async move { res.await.map(ServiceResponse::map_into_left_body) })
    }
}
