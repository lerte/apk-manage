import 'reflect-metadata'
import * as Koa from 'koa'
import {Context} from 'koa'
import * as os from 'os'
import * as fs from 'fs'
import * as path from 'path'
import * as cors from 'koa2-cors'
import * as auth from 'koa-basic-auth'
import * as Router from 'koa-router'
import * as koaBody from 'koa-body'
import * as send from 'koa-send'
import * as aapt from './node-aapt'
import * as AdmZip from 'adm-zip'
import * as bodyParser from 'koa-bodyparser'
import * as dotenv from 'dotenv'

export default class Application {
    koa: Koa
    port: Number
    router: Router
    credentials: Object

    constructor(){
        this.koa = new Koa()
	    this.port = 1987
	    dotenv.config()
	    this.router = new Router()
	    this.credentials = { name: process.env.credential_name, pass: process.env.credential_pass }
    }

    async start(){
        // custom 401 handling
        this.koa.use(async function(ctx, next) {
            try {
                await next()
                } catch (err) {
                if (err.status === 401) {
                    ctx.status = 401
                    ctx.set('WWW-Authenticate', 'Basic')
                    ctx.body = 'You have no access here'
                } else {
                    throw err
                }
            }
        })
        
        this.router.get('/', async (ctx: Context)=>{
            ctx.redirect('/www')
        })
        // require auth
        this.router.get('/www*', auth(this.credentials), async (ctx: Context) => {
            if ('/www' == ctx.path){
                await send(ctx, ctx.path+'/index.html', { root: __dirname + './../content' })
            }else{
                await send(ctx, ctx.path, { root: __dirname + './../content' })
            }
        })

        this.router.get('/upload/*', async (ctx: Context) => {
            await send(ctx, ctx.path, { root: __dirname + './../content' })
        })

        this.router.post('/upload', async (ctx: Context) => {
            const file = ctx.request.body.files.file
            const reader = await fs.createReadStream(file.path)
            let manifest
            await aapt(file.path , (err, data) => {
                if (err) {
                  console.log(err)
                } else {
                  const packageInfo = data.match(/name='([^']+)'[\s]*versionCode='(\d+)'[\s]*versionName='([^']+)/)
                  const applicationInfo = data.match(/label='([^']+)'[\s]*icon='([^']+)/)
                  manifest = {
                    package : packageInfo[1],
                    versionCode : packageInfo[2],
                    versionName : packageInfo[3],
                    label: applicationInfo[1],
                    icon: applicationInfo[2]
                  }
                }
            });
            const stream = await fs.createWriteStream(path.join(__dirname+'./../content/upload', manifest.package+'.apk'))
	        await reader.pipe(stream)
	        // backup this version
            const backup = await fs.createWriteStream(path.join(__dirname+'./../content/upload', manifest.package+'-v'+manifest.versionName+'.apk'))
            await reader.pipe(backup)
            await reader.close()
            // get icon from apk
            const zip = await new AdmZip(file.path)
            const zipEntries = zip.getEntries()
            zipEntries.forEach(zipEntry => {
                if(zipEntry.entryName == manifest.icon){
                    zip.extractEntryTo(manifest.icon, path.join(__dirname+'./../content/upload/'), /*maintainEntryPath*/false, /*overwrite*/true)
                }
            })
            manifest['icon'] = '/upload/' + manifest.icon.split('/').pop()
            manifest['success'] = true
            manifest['filename'] = file.name
            manifest['downloadUrl'] = '/upload/'+manifest.package+'.apk'
            ctx.body = Object.assign({}, manifest)
        })

        this.koa.use(koaBody({ multipart: true }))
        this.koa.use(bodyParser())
        this.koa.use(cors())
        this.koa.use(this.router.routes())
        this.koa.use(this.router.allowedMethods())
        this.koa.listen(this.port)
        console.log('Application is running on port ' + this.port)
    }
}


