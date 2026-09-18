const express = require("express")
const fileSystem = require("fs")
const path = require("path")
const cors = require("cors")
const app = express()
const port =3000

app.use(cors())
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

        const songs = mp3Archivos.map((file)=>{
             const nomCan = file.replace(/\.mp3$/i,"")           
            const cancion = nomCan.split("-")

            let artist ="artist desconcido"
            let title = nomCan

            if(cancion.length >= 2){
                artist = cancion[0].trim()
                title = cancion.slice(1).join("-").trim()
            }

            return {
                artist,
                title,
                file,
                url : `/songs/${encodeURIComponent(file)}`
            }
  
        })

        response.json(songs)

    })





})


app.listen(port, ()=>{
    console.log("API de musica")
})


