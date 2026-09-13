"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const core_1 = require("@nestjs/core");
const node_fs_1 = require("node:fs");
const node_path_1 = require("node:path");
const app_module_1 = require("./app.module");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    const config = app.get(config_1.ConfigService);
    const uploadsRoot = (0, node_path_1.join)(process.cwd(), "uploads");
    (0, node_fs_1.mkdirSync)(uploadsRoot, { recursive: true });
    app.useStaticAssets(uploadsRoot, { prefix: "/uploads/" });
    app.enableCors({
        origin: config.get("FRONTEND_ORIGIN") ?? "http://localhost:3000",
        credentials: true,
    });
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
    }));
    const port = config.get("PORT") ?? 4000;
    await app.listen(port);
}
void bootstrap();
//# sourceMappingURL=main.js.map