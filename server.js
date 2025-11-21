const express=require('express');
const fileUpload=require('express-fileupload');
const {createClient}=require('webdav');

const app=express();
app.use(fileUpload());

const client=createClient(
    "https://DEIN_NEXTCLOUD_SERVER/remote.php/dav/files/USERNAME/",
    {username:"USERNAME",password:"PASSWORD"}
);

app.post('/upload',async(req,res)=>{
    try{
        const {bezirk,bkz,code}=req.body;
        const useCode=true; // Zahlencode aktivieren/deaktivieren
        if(useCode && code!=="12345"){ return res.send("Falscher Zahlencode"); }

        const folderPath=`/${bezirk}/${bkz}`;
        try{ await client.createDirectory(folderPath); }catch(e){}

        for(const key in req.files){
            let file=req.files[key];
            let filePath=`${folderPath}/${file.name}`;
            if(await client.exists(filePath)){
                const ts=new Date().toISOString().replace(/[:.-]/g,'');
                const parts=file.name.split('.');
                filePath=`${folderPath}/${parts[0]}_${ts}.${parts[1]}`;
            }
            await client.putFileContents(filePath,file.data);
        }
        res.send("Upload abgeschlossen");
    }catch(err){ res.send("Fehler: "+err);}
});

app.listen(3000,()=>console.log("Server läuft auf Port 3000"));
