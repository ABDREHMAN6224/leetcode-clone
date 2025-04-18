"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const problem_1 = __importDefault(require("./routes/problem"));
const dotenv_1 = __importDefault(require("dotenv"));
const AppError_1 = __importDefault(require("./utils/AppError"));
const error_1 = __importDefault(require("./controllers/error"));
dotenv_1.default.config();
console.log(process.env.DATABSE_URL);
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.use("/api", problem_1.default);
app.all("*", (req, res, next) => {
    next(new AppError_1.default(`Can't find ${req.originalUrl} on this server!`, 404));
});
app.use(error_1.default);
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        app.listen(3000, () => {
            console.log("Server is running on port 3000");
        });
    });
}
main();
