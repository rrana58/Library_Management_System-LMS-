import { app } from "./app.js";

app.listen(process.env.PORT, () => {
    // USE BACKTICKS (the key above Tab), not single quotes
    console.log(`Server is running on port ${process.env.PORT}`);
});