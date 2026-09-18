const express = require("express")
const fileSystem = require("fs")
const path = require("path")
const app = express()
const port =3000

const carpeta_songs = path.join(__dirname,"songs")

app.use("/songs", express.static(carpeta_songs))

app.get("/api/songs",(request, response)=>{

    fileSystem.readdir(carpeta_songs,(err, files)=>{

        if(err){
            console.log("No se pudo leer la carpeta")
            
            response.status(500).json({error:"No funca!"})
        }

        const mp3Archivos = files.filter(
            (file)=> path.extname(file).toLowerCase() === ".mp3"
        )

        const canciones = mp3Archivos.map((file)=>{
             file.replace(/\.mp3$/i,"")            

        })


    })





})


app.listen(port, ()=>{
    console.log("API de musica")
})


