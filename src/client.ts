// Sends RPCs to a soia service from the browser.
//
// Run:
//   npm run server
// then visit:
//   http://localhost:8787/
import {
  AddUser,
  AddUserRequest,
  GetUser,
  GetUserRequest,
} from "../soiagen/service";
import { TARZAN, User } from "../soiagen/user";
import { ServiceClient } from "soia";

const serviceClient = new ServiceClient("http://localhost:8787/myapi");

async function callService(): Promise<void> {
  console.log("About to add 2 users: John Doe and Tarzan");

  await serviceClient.invokeRemote(
    AddUser,
    AddUserRequest.create({
      user: User.create({
        userId: 42,
        name: "John Doe",
      }),
    }),
  );

  await serviceClient.invokeRemote(
    AddUser,
    AddUserRequest.create({
      user: TARZAN,
    }),
  );

  console.log("Done");

  const foundUser = await serviceClient.invokeRemote(
    GetUser,
    GetUserRequest.create({
      userId: 123,
    }),
    "GET",
    // ^ note that POST would work too
  );

  console.log(`Found user: ${foundUser.user}`);
}

callService();
