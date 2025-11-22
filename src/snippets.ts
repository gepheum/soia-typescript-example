// Code snippets showing how to use TypeScript-generated data classes.
//
// Run with:
//   npm run snippets

import assert from "assert";
import { parseTypeDescriptorFromJson, Timestamp } from "soia";
import { TARZAN, User, UserHistory, UserRegistry } from "../soiagen/user";

// FROZEN STRUCT CLASSES

// For every struct S in the .soia file, soia generates a frozen (deeply
// immutable) class 'S'  and a mutable class 'S.Mutable'.

// Construct a frozen User with User.create({...})
const john = User.create({
  userId: 42,
  name: "John Doe",
  quote: "Coffee is just a socially acceptable form of rage.",
  pets: [
    {
      name: "Dumbo",
      heightInMeters: 1.0,
      picture: "🐘",
    },
  ],
  subscriptionStatus: "FREE",
  // foo: "bar",
  // ^ Does not compile: 'foo' is not a field of User
});

assert(john.name === "John Doe");

// With create<"partial">({...}), you don't need to specify all the fields of
// the struct.
const jane = User.create<"partial">({
  userId: 43,
  name: "Jane Doe",
  pets: [{ name: "Fluffy" }, { name: "Fido" }],
});

// Missing fields are initialized to their default values.
assert(jane.quote === "");

const janeHistory = UserHistory.create({
  user: jane,
  // ^ the object you pass to create({...}) can contain struct values
  sessions: [
    {
      login: Timestamp.fromUnixMillis(1234),
      logout: Timestamp.fromUnixMillis(2345),
    },
  ],
});

const defaultUser = User.DEFAULT;
assert(defaultUser.name === "");
// User.DEFAULT is same as User.create<"partial">({});

// MUTABLE STRUCT CLASSES

// User.Mutable is a mutable version of User.
const lylaMut = new User.Mutable();
lylaMut.userId = 44;
lylaMut.name = "Lyla Doe";

// The User.Mutable() constructor also accepts an initializer object.
const jolyMut = new User.Mutable({ userId: 45 });
jolyMut.name = "Joly Doe";

// jolyHistoryMut.user.quote = "I am Joly.";
// ^ Does not compile: quote is readonly because jolyHistoryMut.user might be
// a frozen struct

const jolyHistoryMut = new UserHistory.Mutable();
jolyHistoryMut.user = jolyMut;
// ^ The right-hand side of the assignment can be either frozen or mutable.

// The mutableUser() getter first checks if 'user' is already a mutable struct,
// and if so, returns it. Otherwise, it assigns to 'user' a mutable shallow copy
// of itself and returns it.
jolyHistoryMut.mutableUser.quote = "I am Joly.";

// Similarly, mutablePets() first checks if 'pets' is already a mutable array,
// and if so, returns it. Otherwise, it assigns to 'pets' a mutable shallow copy
// of itself and returns it.
lylaMut.mutablePets.push(User.Pet.create<"partial">({ name: "Cupcake" }));
lylaMut.mutablePets.push(new User.Pet.Mutable({ name: "Simba" }));

// CONVERTING BETWEEN FROZEN AND MUTABLE STRUCTS

// toMutable() does a shallow copy of the frozen struct, so it's cheap. All the
// properties of the copy hold a frozen value.
const evilJaneMut = jane.toMutable();
evilJaneMut.name = "Evil Jane";

// toFrozen() recursively copies the mutable values held by properties of the
// object. It's cheap if all the values are frozen, like in this example.
const evilJane: User = evilJaneMut.toFrozen();

// 'User.OrMutable' is a type alias for 'User | User.Mutable'.
function greet(user: User.OrMutable) {
  console.log(`Hello, ${user.name}`);
}

greet(jane);
// Hello, Jane Doe
greet(lylaMut);
// Hello, Lyla Doe

// MAKING ENUM VALUES

const johnStatus = User.SubscriptionStatus.FREE;
const janeStatus = User.SubscriptionStatus.PREMIUM;
const lylaStatus = User.SubscriptionStatus.create("PREMIUM");
// ^ same as User.SubscriptionStatus.PREMIUM
const jolyStatus = User.SubscriptionStatus.UNKNOWN;

// Use create({kind: ..., value: ...}) for data variants.
const roniStatus = User.SubscriptionStatus.create({
  kind: "trial",
  value: {
    startTime: Timestamp.fromUnixMillis(1234),
  },
});

// CONDITIONS ON ENUMS

// Use e.kind === "CONSTANT_NAME" to check if the enum value is a constant.
assert(johnStatus.kind === "FREE");
assert(johnStatus.value === undefined);

// Use "?" for UNKNOWN.
assert(jolyStatus.kind === "?");

assert(roniStatus.kind === "trial");
assert(roniStatus.value!.startTime.unixMillis === 1234);

function getSubscriptionInfoText(status: User.SubscriptionStatus): string {
  // Use the 'union' getter for typesafe switches on enums.
  switch (status.union.kind) {
    case "?":
      return "Unknown subscription status";
    case "FREE":
      return "Free user";
    case "PREMIUM":
      return "Premium user";
    case "trial":
      // Here the compiler knows that the type of union.value is 'User.Trial'.
      return "On trial since " + status.union.value.startTime;
  }
}

// SERIALIZATION

const serializer = User.serializer;

// Serialize 'john' to dense JSON.
console.log(serializer.toJsonCode(john));
// [42,"John Doe"]

// Serialize 'john' to readable JSON.
console.log(serializer.toJsonCode(john, "readable"));
// {
//   "user_id": 42,
//   "name": "John Doe"
// }

// The dense JSON flavor is the flavor you should pick if you intend to
// deserialize the value in the future. Soia allows fields to be renamed, and
// because fields names are not part of the dense JSON, renaming a field does
// not prevent you from deserializing the value.
// You should pick the readable flavor mostly for debugging purposes.

// Serialize 'john' to binary format.
console.log(serializer.toBytes(john));

// The binary format is not human readable, but it is slightly more compact than
// JSON, and serialization/deserialization can be a bit faster in languages like
// C++. Only use it when this small performance gain is likely to matter, which
// should be rare.

// Use fromJson(), fromJsonCode() and fromBytes() to deserialize.

const reserializedJohn = serializer.fromJsonCode(serializer.toJsonCode(john));
assert(reserializedJohn.name === "John Doe");

const reserializedJane = serializer.fromJsonCode(
  serializer.toJsonCode(jane, "readable"),
);
assert(reserializedJane.name === "Jane Doe");

const reserializedLyla = serializer.fromBytes(
  serializer.toBytes(lylaMut).toBuffer(),
);
assert(reserializedLyla.name === "Lyla Doe");

// FROZEN ARRAYS AND COPIES

const pets = [
  User.Pet.create<"partial">({ name: "Fluffy" }),
  User.Pet.create<"partial">({ name: "Fido" }),
];

const jade = User.create<"partial">({
  pets: pets,
  // ^ makes a copy of 'pets' because 'pets' is mutable
});

// jade.pets.push(...)
// ^ Compile-time error: pets is readonly

assert(jade.pets !== pets);

const jack = User.create<"partial">({
  pets: jade.pets,
  // ^ doesn't make a copy because 'jade.pets' is frozen
});

assert(jack.pets === jade.pets);

// KEYED ARRAYS

const userRegistry = UserRegistry.create({
  users: [john, jane, lylaMut],
});

// searchUsers() returns the user with the given key (specified in the .soia
// file). In this example, the key is the user id.
// The first lookup runs in O(N) time, and the following lookups run in O(1)
// time.
assert(userRegistry.searchUsers(42) === john);
assert(userRegistry.searchUsers(100) === undefined);

// CONSTANTS

console.log(TARZAN);
// User {
//   userId: 123,
//   name: 'Tarzan',
//   quote: 'AAAAaAaAaAyAAAAaAaAaAyAAAAaAaAaA',
//   pets: [ User_Pet { name: 'Cheeta', heightInMeters: 1.67, picture: '🐒' } ],
//   subscriptionStatus: User_SubscriptionStatus {
//     kind: 'trial',
//     value: User_Trial { startTime: [Timestamp] }
//   }
// }

// REFLECTION

// Reflection allows you to inspect a soia type at runtime.

const fieldNames: string[] = [];
for (const field of User.serializer.typeDescriptor.fields) {
  const { name, number, property, type } = field;
  fieldNames.push(name);
}
console.log(fieldNames);
// [ 'user_id', 'name', 'quote', 'pets', 'subscription_status' ]

// A type descriptor can be serialized to JSON and deserialized later.
const typeDescriptor = parseTypeDescriptorFromJson(
  User.serializer.typeDescriptor.asJson(),
);
