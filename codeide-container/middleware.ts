export { auth as middleware } from "@/auth";
// export const config = { matcher: ["/dashboard(.*)"], unstable_allowDynamic: ["mongoose/dist/browser.umd.js"] };

export const config = {
  matcher: ["/dashboard(.*)"],
  runtime: "nodejs",
  unstable_allowDynamic: [
    // allows a single file
    "/src/db/lib/dbConnect.js",
    // use a glob to allow anything in the function-bind 3rd party module
    "/node_modules/mongoose/dist/**",
  ],
};
