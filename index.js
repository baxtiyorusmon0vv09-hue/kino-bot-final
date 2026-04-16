const { Telegraf, Markup } = require("telegraf");
const mongoose = require("mongoose");
const http = require("http");

// 1. Render/Glitch uxlab qolmasligi uchun server
const PORT = process.env.PORT || 3000;
http.createServer((req, res) => {
  res.write("Bot is alive!");
  res.end();
}).listen(PORT, () => {
  console.log("Web server ishga tushdi");
});

// 2. Bot va Baza sozlamalari
const bot = new Telegraf("8576419471:AAFbS7-dGbE34qMbJIm15sG0FJAubpwuOX8");
const ADMIN_ID = 8313632734;

mongoose.connect("mongodb+srv://kino_db_user:010203baxa04@cluster0.b1jjvsn.mongodb.net/kino_bot")
  .then(() => console.log("✅ MongoDB ulandi"))
  .catch(err => console.log("❌ DB xatosi:", err));

// 3. Ma'lumotlar modellari
const User = mongoose.model("User", {
  userId: Number,
  refCount: { type: Number, default: 0 }
});

const Movie = mongoose.model("Movie", {
  code: String,
  title: String,
  quality: String,
  fileId: String
});

// 4. Bot funksiyalari
bot.start(async (ctx) => {
  try {
    let user = await User.findOne({ userId: ctx.from.id });
    if (!user) await User.create({ userId: ctx.from.id });
    
    const menu = ctx.from.id == ADMIN_ID 
      ? Markup.keyboard([["🎬 Kino qo'shish", "📊 Statistika"]]).resize()
      : Markup.keyboard([["🔍 Kino qidirish", "👤 Profil"]]).resize();
      
    ctx.reply("🎬 Xush kelibsiz! Kino kodini yuboring:", menu);
  } catch (e) { console.log(e); }
});

bot.hears("📊 Statistika", async (ctx) => {
  if (ctx.from.id !== ADMIN_ID) return;
  const uCount = await User.countDocuments();
  const mCount = await Movie.countDocuments();
  ctx.reply(`👤 Foydalanuvchilar: ${uCount}\n🎬 Kinolar: ${mCount}`);
});

bot.on("text", async (ctx) => {
  const text = ctx.message.text;
  if (!isNaN(text)) {
    const movie = await Movie.findOne({ code: text });
    if (movie) {
      return ctx.replyWithVideo(movie.fileId, { caption: `🎬 ${movie.title}` });
    }
    return ctx.reply("😔 Bu kod bilan kino topilmadi.");
  }
});

// Admin uchun video File ID sini aniqlash (Oddiy usul)
bot.on("video", (ctx) => {
  if (ctx.from.id === ADMIN_ID) {
    ctx.reply("Video File ID: " + ctx.message.video.file_id);
  }
});

bot.launch();
console.log("🤖 Bot ishga tushdi!");
