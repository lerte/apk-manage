"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const Koa = require("koa");
const fs = require("fs");
const path = require("path");
const cors = require("koa2-cors");
const auth = require("koa-basic-auth");
const Router = require("koa-router");
const koaBody = require("koa-body");
const send = require("koa-send");
const ApkReader = require("adbkit-apkreader");
const bodyParser = require("koa-bodyparser");
const dotenv = require("dotenv");
class Application {
    constructor() {
        this.koa = new Koa();
        this.port = 1987;
        dotenv.config();
        this.router = new Router();
        this.credentials = { name: process.env.credential_name, pass: process.env.credential_pass };
    }
    start() {
        return __awaiter(this, void 0, void 0, function* () {
            // custom 401 handling
            this.koa.use(function (ctx, next) {
                return __awaiter(this, void 0, void 0, function* () {
                    try {
                        yield next();
                    }
                    catch (err) {
                        if (err.status === 401) {
                            ctx.status = 401;
                            ctx.set('WWW-Authenticate', 'Basic');
                            ctx.body = 'You have no access here';
                        }
                        else {
                            throw err;
                        }
                    }
                });
            });
            this.router.get('/', (ctx) => __awaiter(this, void 0, void 0, function* () {
                ctx.redirect('/www');
            }));
            // require auth
            this.router.get('/www*', auth(this.credentials), (ctx) => __awaiter(this, void 0, void 0, function* () {
                if ('/www' == ctx.path) {
                    yield send(ctx, ctx.path + '/index.html', { root: __dirname + './../content' });
                }
                else {
                    yield send(ctx, ctx.path, { root: __dirname + './../content' });
                }
            }));
            this.router.get('/upload/*', (ctx) => __awaiter(this, void 0, void 0, function* () {
                yield send(ctx, ctx.path, { root: __dirname + './../content' });
            }));
            this.router.post('/upload', (ctx) => __awaiter(this, void 0, void 0, function* () {
                const file = ctx.request.body.files.file;
                const reader = yield fs.createReadStream(file.path);
                yield ApkReader.open(file.path)
                    .then(read => read.readManifest()).then(manifest => ctx.body = manifest);
                const stream = yield fs.createWriteStream(path.join(__dirname + './../content/upload', ctx.body.package + '.apk'));
                yield reader.pipe(stream);
                // backup this version
                const backup = yield fs.createWriteStream(path.join(__dirname + './../content/upload', ctx.body.package + '-v' + ctx.body.versionName + '.apk'));
                yield reader.pipe(backup);
                ctx.body['success'] = true;
                ctx.body['filename'] = file.name;
                ctx.body['downloadUrl'] = '/upload/' + ctx.body.package + '.apk';
            }));
            this.koa.use(koaBody({ multipart: true }));
            this.koa.use(bodyParser());
            this.koa.use(cors());
            this.koa.use(this.router.routes());
            this.koa.use(this.router.allowedMethods());
            this.koa.listen(this.port);
            console.log('Application is running on port ' + this.port);
        });
    }
    firstUpperCase(str) {
        return str.toLowerCase().replace(/( |^)[a-z]/g, (L) => L.toUpperCase());
    }
}
exports.default = Application;
//# sourceMappingURL=Application.js.map