import axios from "axios";

const uploadImage = (file: File) => {
    return new Promise((res, rej) => {

        let access_token = localStorage.getItem("access_token");
        if (!access_token) {
            console.error("Access token not available");
            rej("Access token not available");
        }

        console.log("The downloaded file is ");
        console.log(file);
        let upload_url = "http://localhost:8080/upload";
        let file_name = file.name;
        const formData = new FormData();
        formData.append('file', file);

        console.log("The file is ");
        console.log(file);

        axios.post(upload_url, formData, {
            headers: {
                "Authorization": access_token,
                "Content-Type": 'multipart/form-data',
                "Content-Disposition": `attachment; filename="${file_name}"`
            },
        }).then((d) => {
            res(d.data);
        }).catch((e) => {
            rej(e);
        });
    });
}

export {uploadImage};
