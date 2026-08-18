import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";
import type { UserRole } from "../common/user-role.type";

export type AuthProvider = "password" | "google";
export type UserDocument = HydratedDocument<User>;

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, trim: true })
  fullName: string;

  @Prop({ required: true, lowercase: true, trim: true, unique: true })
  email: string;

  @Prop()
  passwordHash?: string;

  @Prop({ enum: ["password", "google"], default: "password" })
  authProvider: AuthProvider;

  @Prop({ enum: ["admin", "student"], required: true })
  role: UserRole;

  createdAt: Date;
  updatedAt: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);
