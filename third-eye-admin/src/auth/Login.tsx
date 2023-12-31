// in src/MyLoginPage.js
// import * as React from "react";
// import { useState } from "react";
import { useLogin, useNotify } from "react-admin";
import Avatar from "@mui/material/Avatar";
import Button from "@mui/material/Button";
import CssBaseline from "@mui/material/CssBaseline";
import TextField from "@mui/material/TextField";
import FormControlLabel from "@mui/material/FormControlLabel";
import Checkbox from "@mui/material/Checkbox";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Container from "@mui/material/Container";
import ThirdEyeLogo from "../assets/logo.png";

const MyLoginPage = () => {
    const login = useLogin();
    const notify = useNotify();

    const handleSubmit = (event: any) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);

        const email = data.get("email")!.toString();
        const password = data.get("password")!.toString();

        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

        if (!emailRegex.test(email)) {
            notify("Invalid email address!", { type: "error" });
        } else {
            console.log({
                email: email,
                password: password
            });
            // will call authProvider.login({ email, password })
            login({ email, password }).catch(() =>
                notify("Invalid email or password", { type: "error" })
            );
        }
    };

    return (
        <Container component="main" maxWidth="xs">
            <CssBaseline />
            <Box
                mt={0}
                sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center"
                }}
            >
                <Avatar
                    sx={{ m: 1, bgcolor: "rgb(49, 49, 49)", height: 200, width: 200, padding: 3 }}
                    src={ThirdEyeLogo}
                ></Avatar>
                <Typography component="h1" variant="h5" mt="0.5em">
                    Sup! Please Log In
                </Typography>
                <Box
                    component="form"
                    onSubmit={handleSubmit}
                    noValidate
                    sx={{ mt: 1 }}
                    textAlign="start"
                >
                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        id="email"
                        label="Email Address"
                        name="email"
                        autoComplete="email"
                        autoFocus
                    />
                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        name="password"
                        label="Password"
                        type="password"
                        id="password"
                        autoComplete="current-password"
                    />
                    <Box mt={"0.6em"}>
                        <FormControlLabel
                            control={<Checkbox value="remember" color="primary" />}
                            label="Remember me"
                        />
                    </Box>

                    <Button
                        type="submit"
                        fullWidth
                        variant="contained"
                        sx={{ mt: 3, mb: 2 }}
                    >
                        Log In
                    </Button>
                </Box>
            </Box>
        </Container>
    );
};

export default MyLoginPage;
