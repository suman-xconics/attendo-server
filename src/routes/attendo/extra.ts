// import { OpenAPIHono } from "@hono/zod-openapi";
// import {
//   list,
//   list_by_employee,
//   create,
//   update_post,
//   update_put,
//   remove,
//   get,
//   list_my_attendance,
// } from "./openapi.route";
// import { AppBindings } from "@/types/app";
// import { advancedQuery, JoinConfig } from "@/utils/filter-pagination-sorting";
// import { db } from "@/db";
// import { attendo, user } from "@/db/schema";
// import { generatePaginationMetadata } from "@/utils/pagination";
// import { generateRandomId } from "@/utils/gen-id";
// import { and, eq, sql } from "drizzle-orm";

// export const attendanceGroup = new OpenAPIHono<AppBindings>()
//   // .openapi(list_by_employee, async (c) => {
//   //   const filteringInput = c.req.valid("query");
//   //   const mac_address = c.req.param("id");

//   //   const BASE_CONDITION = eq(attendo.id_value, mac_address);
//   //   const { data, total_items } = await advancedQuery(
//   //     db,
//   //     attendo,
//   //     filteringInput,
//   //     undefined,
//   //     [{ field: "device_time", order: "desc" }],
//   //     ["row_id", "id_value"],
//   //     BASE_CONDITION,
//   //     undefined,
//   //     "device_time"
//   //   );
//   //   const pagination = generatePaginationMetadata(c, total_items);

//   //   return c.json({ success: true, data, pagination }, 200);
//   // })
//   .openapi(list, async (c) => {
//     const filteringInput = c.req.valid("query");

//     const selectColumns = {
//       row_id: attendo.row_id,
//       id_value: attendo.id_value,
//       person_name: attendo.person_name,
//       rssi: attendo.rssi,
//       device_time: attendo.device_time,
//       received_at: attendo.received_at,
//     };

//     // const BASE_CONDITION = eq(user.role,"EMPLOYEE");
//     const { data, total_items } = await advancedQuery(
//       db,
//       attendo,
//       filteringInput,
//       selectColumns,
//       [{ field: "device_time", order: "desc" }],
//       ["row_id", "id_value"],
//       undefined,
//       [
//         {
//           table: user,
//           on: eq(attendo.id_value, user.macAddress),
//         },
//       ],
//       "device_time"
//     );
//     const pagination = generatePaginationMetadata(c, total_items);

//     return c.json({ success: true, data, pagination }, 200);
//   })
//   .openapi(list_my_attendance, async (c) => {
//     const filteringInput = c.req.valid("query");
//     const currentUser = c.get("user") as { macAddress?: string } | undefined;

//     if (!currentUser) {
//       return c.json(
//         {
//           success: false,
//           error: {
//             name: "Unauthorized",
//             message: "Authentication required",
//           },
//         },
//         401
//       );
//     }
//     if(!currentUser.macAddress){
//       return c.json(
//         {
//           success: false,
//           error: {
//             name: "Unauthorized",
//             message: "MAC Address not found in user profile",
//           },
//         },
//         401
//       );
//     }

//     const BASE_CONDITION = eq(attendo.id_value, currentUser.macAddress as string);
//     const { data, total_items } = await advancedQuery(
//       db,
//       attendo,
//       filteringInput,
//       undefined,
//       [{ field: "device_time", order: "desc" }],
//       ["row_id", "id_value"],
//       BASE_CONDITION,
//       undefined,
//       "device_time"
//     );
//     const pagination = generatePaginationMetadata(c, total_items);

//     return c.json({ success: true, data, pagination }, 200);
//   })
//   .openapi(create, async (c) => {
//     const data = c.req.valid("json");

//     const deviceTime = data.entryTime;
//     const attendanceDate = deviceTime.toISOString().slice(0, 10);

//     const existingRecord = await db
//       .select({ id: attendo.id })
//       .from(attendo)
//       .where(
//         and(
//           eq(attendo.id_value, data.id_value),
//           eq(attendence.date, attendanceDate)
//         )
//       )
//       .limit(1);

//     if (existingRecord.length > 0) {
//       return c.json(
//         {
//           success: false,
//           error: {
//             name: "DuplicateAttendanceError",
//             message:
//               "Attendance record already exists for this user on this date",
//             existingId: existingRecord[0].id,
//           },
//         },
//         409
//       );
//     }

//     const id = generateRandomId();

//     const [result] = await db
//       .insert(attendence)
//       .values({
//         id,
//         manual: true,
//         ...data,
//         date: attendanceDate, // ✅ explicitly set
//       })
//       .returning({ id: attendence.id });

//     return c.json(result, 201);
//   })
//   .openapi(create_by_mac_address, async (c) => {
//     const data = c.req.valid("json");

//     const userRecord = await db
//       .select({ id: user.id })
//       .from(user)
//       .where(eq(user.macAddress, data.macAddress))
//       .limit(1)
//       .then((res) => res[0]);

//     // ✅ derive date from entryTime
//     const attendanceDate = data.entryTime.toISOString().slice(0, 10);

//     // ✅ duplicate check using userId + date
//     const existingRecord = await db
//       .select({ id: attendence.id })
//       .from(attendence)
//       .where(
//         and(
//           eq(attendence.userId, userRecord.id),
//           eq(attendence.date, attendanceDate)
//         )
//       )
//       .limit(1);

//     if (existingRecord.length > 0) {
//       return c.json(
//         {
//           success: false,
//           error: {
//             name: "DuplicateAttendanceError",
//             message:
//               "Attendance record already exists for this user on this date",
//             existingId: existingRecord[0].id,
//           },
//         },
//         409
//       );
//     }

//     const id = generateRandomId();

//     const [result] = await db
//       .insert(attendence)
//       .values({
//         id,
//         userId: userRecord.id,
//         ...data,
//         date: attendanceDate,
//       })
//       .returning({ id: attendence.id });

//     return c.json(result, 201);
//   })
//   .openapi(get, async (c) => {
//     const id = c.req.param("id");

//     const attendanceRecord = await db
//       .select()
//       .from(attendence)
//       .where(eq(attendence.id, id))
//       .limit(1)
//       .then((res) => res[0]);

//     if (!attendanceRecord) {
//       return c.json(
//         {
//           success: false,
//           error: {
//             name: "NotFoundError",
//             message: "Attendance record not found.",
//           },
//         },
//         404
//       );
//     }

//     return c.json(attendanceRecord, 200);
//   })
//   // .openapi(update_by_mac_address, async (c) => {
//   //   const mac_address = c.req.param("mac_address");
//   //   const data = c.req.valid("json");

//   //   const userRecord = await db
//   //     .select({ id: user.id })
//   //     .from(user)
//   //     .where(eq(user.macAddress, mac_address))
//   //     .limit(1)
//   //     .then((res) => res[0]);

//   //   if (!userRecord) {
//   //     return c.json(
//   //       {
//   //         success: false,
//   //         error: {
//   //           name: "NotFoundError",
//   //           message: "User not found for this MAC address",
//   //         },
//   //       },
//   //       404
//   //     );
//   //   }

//   //   // ✅ derive date from entryTime
//   //   const attendanceDate = data.entryTime.toISOString().slice(0, 10);

//   //   // ✅ find attendance by userId + date
//   //   const attendanceRecord = await db
//   //     .select({ id: attendence.id })
//   //     .from(attendence)
//   //     .where(
//   //       and(
//   //         eq(attendence.userId, userRecord.id),
//   //         eq(attendence.date, attendanceDate)
//   //       )
//   //     )
//   //     .limit(1)
//   //     .then((res) => res[0]);

//   //   if (!attendanceRecord) {
//   //     return c.json(
//   //       {
//   //         success: false,
//   //         error: {
//   //           name: "NotFoundError",
//   //           message: "Attendance record not found for this date",
//   //         },
//   //       },
//   //       404
//   //     );
//   //   }

//   //   await db
//   //     .update(attendence)
//   //     .set({
//   //       ...data,
//   //     })
//   //     .where(eq(attendence.id, attendanceRecord.id));

//   //   const updatedRecord = await db
//   //     .select()
//   //     .from(attendence)
//   //     .where(eq(attendence.id, attendanceRecord.id))
//   //     .limit(1)
//   //     .then((res) => res[0]);

//   //   return c.json(updatedRecord, 200);
//   // })
//   .openapi(update_put, async (c) => {
//     const id = c.req.param("id");
//     const data = c.req.valid("json");

//     const attendanceRecord = await db
//       .select()
//       .from(attendence)
//       .where(eq(attendence.id, id))
//       .limit(1)
//       .then((res) => res[0]);

//     if (!attendanceRecord) {
//       return c.json(
//         {
//           success: false,
//           error: {
//             name: "NotFoundError",
//             message: "Attendance record not found.",
//           },
//         },
//         404
//       );
//     }

//     await db
//       .update(attendence)
//       .set({
//         ...data,
//       })
//       .where(eq(attendence.id, id));

//     const updatedRecord = await db
//       .select()
//       .from(attendence)
//       .where(eq(attendence.id, id))
//       .limit(1)
//       .then((res) => res[0]);

//     return c.json(updatedRecord, 200);
//   })
//   .openapi(update_post, async (c) => {
//     const id = c.req.param("id");
//     const data = c.req.valid("json");

//     const attendanceRecord = await db
//       .select()
//       .from(attendence)
//       .where(eq(attendence.id, id))
//       .limit(1)
//       .then((res) => res[0]);

//     if (!attendanceRecord) {
//       return c.json(
//         {
//           success: false,
//           error: {
//             name: "NotFoundError",
//             message: "Attendance record not found.",
//           },
//         },
//         404
//       );
//     }

//     await db
//       .update(attendence)
//       .set({
//         ...data,
//       })
//       .where(eq(attendence.id, id));

//     const updatedRecord = await db
//       .select()
//       .from(attendence)
//       .where(eq(attendence.id, id))
//       .limit(1)
//       .then((res) => res[0]);

//     return c.json(updatedRecord, 200);
//   })
//   .openapi(remove, async (c) => {
//     const id = c.req.param("id");

//     const attendanceRecord = await db
//       .select()
//       .from(attendence)
//       .where(eq(attendence.id, id))
//       .limit(1)
//       .then((res) => res[0]);

//     if (!attendanceRecord) {
//       return c.json(
//         {
//           success: false,
//           error: {
//             name: "NotFoundError",
//             message: "Attendance record not found.",
//           },
//         },
//         404
//       );
//     }

//     await db.delete(attendence).where(eq(attendence.id, id));

//     return c.json(
//       { success: true, message: "Attendance record deleted." },
//       200
//     );
//   });
