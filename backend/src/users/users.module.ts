import { Module } from "@nestjs/common";
import { StoreModule } from "../store.module";
import { UsersService } from "./users.service";

@Module({
  imports: [StoreModule],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
