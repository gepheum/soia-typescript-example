// Starts a soia service on http://localhost:8787/?myapi
//
// Run with:
//   npm run server
//
// Visit http://localhost:8787/ in your browser to send RPCs to the service.
import {
  AddUser,
  AddUserRequest,
  AddUserResponse,
  GetUser,
  GetUserRequest,
  GetUserResponse,
} from "../soiagen/service";
import { User } from "../soiagen/user";
import express, { Request, Response } from "express";
import path from "path";
import { ServiceImpl, installServiceOnExpressApp } from "soia";

const app = express();
const port = 8787;

app.use(express.static(path.join(__dirname, "../../static")));

app.get("/", (req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

class MyService {
  async addUser(req: AddUserRequest): Promise<AddUserResponse> {
    this.users[req.user.userId] = req.user;
    return AddUserResponse.create({});
  }

  async getUser(req: GetUserRequest): Promise<GetUserResponse> {
    const user = this.users[req.userId];
    if (user) {
      return GetUserResponse.create({ user: user });
    } else {
      return GetUserResponse.DEFAULT;
    }
  }

  private readonly users: { [id: string]: User } = {};
}

const myService = new MyService();

installServiceOnExpressApp(
  app,
  "/myapi",
  new ServiceImpl()
    .addMethod(AddUser, async (req) => myService.addUser(req))
    .addMethod(GetUser, async (req) => myService.getUser(req)),
  express.text,
);

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}/`);
});

