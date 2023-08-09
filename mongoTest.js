require('dotenv').config();
const MongoClient = require("mongodb").MongoClient;
const { Telegraf } = require('telegraf');
const bot = new Telegraf(process.env.BOT_TOKEN);
const Markup = require("telegraf/markup.js");
    
const url = "spamigor.site:27017";
const username = encodeURIComponent(process.env.LOGIN);
const password = encodeURIComponent(process.env.PASS);
const authMechanism = "DEFAULT";
const uri =`mongodb://${username}:${password}@${url}/?authMechanism=${authMechanism}`;
const mongoClient = new MongoClient(uri);
const WebSocketClient = require('websocket').client;
const socketPort = '8080/';
let client = new WebSocketClient();

let userIdBuffer = {
	id: [],
	collectionId: []
}

let forSave = {
	id: [],
	name: [],
	price: [],
	url: [],
	pict: []
}

let wishBuffer = {
	id: [],
	list: []
};

let mimoCrocodil = {
	id: [],
	seechId: [],
	filter: []
}
  
mongoClient.connect(function(err, client){
       
    const db = client.db("wishBot");
    const collection = db.collection("userIdBuffer");
    collection.find().toArray(function(err, result){
           
        if(err){ 
            return console.log(err);
        }
		if(result.length>0)
			for (i=0; i<result.length;i++){
				userIdBuffer.id[i] = result[i].tgId;
				userIdBuffer.collectionId[i] = result[i].collectionId;
			}
        client.close();
    });
});
console.log(userIdBuffer);

bot.start((ctx) => {
	if (userIdBuffer.id.includes(ctx.from.id)){
		ctx.replyWithHTML(
			`Привет ${ctx.from.first_name}, чем я могу помочь?`,
			Markup.inlineKeyboard([
				Markup.callbackButton('Мой список желаний', 'myWish'),
				Markup.callbackButton('Добавить желание', 'newWish'),
				Markup.callbackButton('Мой id', 'myId'),
				Markup.callbackButton('Что у других?', 'noReg'),
				Markup.callbackButton('Удалить аккаунт', 'deleteAkk')
			], {columns: 1}).extra())
	}
	
	else {
		ctx.reply(`Привет ${ctx.from.first_name}`);
		ctx.replyWithHTML(
			'Хочешь посмотреть список пожеланий или зарегистрироваться?\n',
			Markup.inlineKeyboard([
				Markup.callbackButton('Зарегистрироваться', 'yesReg'),
				Markup.callbackButton('Просто посмотреть', 'noReg')
			], {columns: 2}).extra())
	}
});

bot.on('photo', async (ctx) => {
	if ((forSave.id.includes(ctx.from.id))&&(forSave.pict[forSave.id.indexOf(ctx.from.id)]==''))
	{
		forSave.pict[forSave.id.indexOf(ctx.from.id)]=ctx.message.photo[1].file_id;
		let locId = forSave.id.indexOf(ctx.from.id);
		await ctx.reply(`итак, давай посмотрим что получилось\n\nНазвание: ${forSave.name[locId]}\nЦена: ${forSave.price[locId]}\nСсылка: ${forSave.url[locId]}`);
		await ctx.replyWithPhoto(forSave.pict[locId]);
		ctx.replyWithHTML('Все верно?', 
			Markup.inlineKeyboard([
				Markup.callbackButton('Да!', 'yesSaveWish'),
				Markup.callbackButton('Нет', 'noSave')
			], {columns: 2}).extra());
	}
});

bot.help((ctx) => ctx.reply('Я представляю из себя бота-планировщика задач'));

bot.on('callback_query', async (ctx) => {
    ctx.answerCbQuery();
    ctx.deleteMessage();
	let buf = ctx.callbackQuery.data;
	
	if (buf==='no'){
		ctx.replyWithHTML(
			'Нет так нет. Выходим в меню',
			Markup.inlineKeyboard([
				Markup.callbackButton('Мой список желаний', 'myWish'),
				Markup.callbackButton('Добавить желание', 'newWish'),
				Markup.callbackButton('Мой id', 'myId'),
				Markup.callbackButton('Что у других?', 'noReg'),
				Markup.callbackButton('Удалить аккаунт', 'deleteAkk')
			], {columns: 1}).extra())		
	}
	
	if (buf==='yesReg')
	{
		newIdSave(ctx.from.id);
		ctx.replyWithHTML(
			'Я добавил тебя в списки. Выбери действие',
			Markup.inlineKeyboard([
				Markup.callbackButton('Мой список желаний', 'myWish'),
				Markup.callbackButton('Добавить желание', 'newWish'),
				Markup.callbackButton('Мой id', 'myId'),
				Markup.callbackButton('Что у других?', 'noReg'),
				Markup.callbackButton('Удалить аккаунт', 'deleteAkk')
			], {columns: 1}).extra())	
	}
	if (buf==='noReg') {
		ctx.reply('Введи id пользователя, желания которого хотел бы узнать. Используй только цифры');
		mimoCrocodil.id.push(ctx.from.id);
	}
		
	if (buf==='deleteAkk') {
		deleteId(ctx.from.id);
		ctx.reply('Пиздуй');
	}
	if (buf==='myWish') {
		await wishList(ctx.from.id);
		await (console.log('Вызов из функции' + wishBuffer.id));
		if (wishBuffer.list[wishBuffer.id.indexOf(ctx.from.id)]==0)
		{
			ctx.replyWithHTML(
				'Ваш список пуст, может добавим в него что-либо?',
				Markup.inlineKeyboard([
					Markup.callbackButton('Мой список желаний', 'myWish'),
					Markup.callbackButton('Добавить желание', 'newWish'),
					Markup.callbackButton('Мой id', 'myId'),
					Markup.callbackButton('Что у других?', 'noReg'),
					Markup.callbackButton('Удалить аккаунт', 'deleteAkk')
				], {columns: 1}).extra())
		}
		else{
			let aaa = [];
			for (i=0; i<wishBuffer.list[wishBuffer.id.indexOf(ctx.from.id)].length; i++) aaa.push(Markup.callbackButton(wishBuffer.list[wishBuffer.id.indexOf(ctx.from.id)][i].name, ('&&&~'+i.toString())));
			aaa.push(Markup.callbackButton('Вернуться в главное меню', 'goBackAfterList'));
			ctx.replyWithHTML(
			'Выбери по названию',
			Markup.inlineKeyboard(aaa, {columns: 1}).extra());
		}
	}
	if (buf==='newWish')
	{
		ctx.replyWithHTML(
			'Создадим новое желание?',
			Markup.inlineKeyboard([
				Markup.callbackButton('Да!', 'yesNewWish'),
				Markup.callbackButton('Нет', 'no')
			], {columns: 2}).extra())
	}
	
	if (buf==='yesNewWish')
	{
		ctx.reply('Введи название');
		forSave.id.push(ctx.from.id);
		let locId = forSave.id.indexOf(ctx.from.id);
		forSave.name[locId]='';
		forSave.price[locId]=0;
		forSave.url[locId]='';
		forSave.pict[locId]='';
	}
	
	if (buf==='yesSaveWish')
	{
		let locId = forSave.id.indexOf(ctx.from.id);
		saveWish(ctx.from.id, forSave.name[locId], forSave.price[locId], forSave.url[locId], forSave.pict[locId])
			ctx.replyWithHTML('Запись сохранена', 
				Markup.inlineKeyboard([
					Markup.callbackButton('Мой список желаний', 'myWish'),
					Markup.callbackButton('Добавить желание', 'newWish'),
					Markup.callbackButton('Мой id', 'myId'),
					Markup.callbackButton('Что у других?', 'noReg'),
					Markup.callbackButton('Удалить аккаунт', 'deleteAkk')
				], {columns: 1}).extra());
	}
	if (buf==='noSave')
	{
		let locId = forSave.id.indexOf(ctx.from.id);
		forSave.pict.splice(locId, 1);
		forSave.url.splice(locId, 1);
		forSave.price.splice(locId, 1);
		forSave.name.splice(locId, 1);
		forSave.id.splice(locId, 1);
		ctx.replyWithHTML('Запись удалена', 
			Markup.inlineKeyboard([
				Markup.callbackButton('Мой список желаний', 'myWish'),
				Markup.callbackButton('Добавить желание', 'newWish'),
				Markup.callbackButton('Мой id', 'myId'),
				Markup.callbackButton('Что у других?', 'noReg'),
				Markup.callbackButton('Удалить аккаунт', 'deleteAkk')
			], {columns: 1}).extra());
	}
	
	if ((buf[0]=='&')&&(buf[1]=='&')&&(buf[2]=='&')&&(buf[3]=='~')) {
		let locBuf=Number(buf.substr(4, 100));
		let id = 0;
		let trig = true;
		mimoCrocodil.id.includes(ctx.from.id) ? id = mimoCrocodil.seechId[mimoCrocodil.id.indexOf(ctx.from.id)] : id = ctx.from.id;
		id == ctx.from.id ? trig = true : trig = false;
		if (wishBuffer.list[wishBuffer.id.indexOf(id)][locBuf].pictId==='-')
		{
			if (wishBuffer.list[wishBuffer.id.indexOf(id)][locBuf].url==='-')
			{
				if (!trig)
					ctx.replyWithHTML(`${wishBuffer.list[wishBuffer.id.indexOf(id)][locBuf].name}\n Примерная стоимость: ${wishBuffer.list[wishBuffer.id.indexOf(id)][locBuf].price}`, 
						Markup.inlineKeyboard([
							Markup.callbackButton('Назад', 'hisWish'),
							Markup.callbackButton('Вернуться в главное меню', 'goBackAfterList')
						], {columns: 1}).extra());		
				else
						ctx.replyWithHTML(`${wishBuffer.list[wishBuffer.id.indexOf(id)][locBuf].name}\n Примерная стоимость: ${wishBuffer.list[wishBuffer.id.indexOf(id)][locBuf].price}`, 
						Markup.inlineKeyboard([
							Markup.callbackButton('Удалить', '~d'+locBuf),
							Markup.callbackButton('Назад', 'myWish'),
							Markup.callbackButton('Вернуться в главное меню', 'goBackAfterList')
						], {columns: 1}).extra());			
			} else	{
				if (!trig)
					ctx.replyWithHTML(`${wishBuffer.list[wishBuffer.id.indexOf(id)][locBuf].name}\n Примерная стоимость: ${wishBuffer.list[wishBuffer.id.indexOf(id)][locBuf].price}\nссылка: ${wishBuffer.list[wishBuffer.id.indexOf(id)][locBuf].url}`, 
						Markup.inlineKeyboard([
							Markup.callbackButton('Назад', 'hisWish'),
							Markup.callbackButton('Вернуться в главное меню', 'goBackAfterList')
						], {columns: 1}).extra());	
				else 
					ctx.replyWithHTML(`${wishBuffer.list[wishBuffer.id.indexOf(id)][locBuf].name}\n Примерная стоимость: ${wishBuffer.list[wishBuffer.id.indexOf(id)][locBuf].price}\nссылка: ${wishBuffer.list[wishBuffer.id.indexOf(id)][locBuf].url}`, 
						Markup.inlineKeyboard([
							Markup.callbackButton('Удалить', '~d'+locBuf),
							Markup.callbackButton('Назад', 'myWish'),
							Markup.callbackButton('Вернуться в главное меню', 'goBackAfterList')
						], {columns: 1}).extra());	
			}
		}
		else {
			if (wishBuffer.list[wishBuffer.id.indexOf(id)][locBuf].url==='-')
			{
				await ctx.replyWithPhoto(wishBuffer.list[wishBuffer.id.indexOf(ctx.from.id)][locBuf].pictId);
				if (!trig) 
					ctx.replyWithHTML(`${wishBuffer.list[wishBuffer.id.indexOf(ctx.from.id)][locBuf].name}\n Примерная стоимость: ${wishBuffer.list[wishBuffer.id.indexOf(ctx.from.id)][locBuf].price}`, 
						Markup.inlineKeyboard([
							Markup.callbackButton('Назад', 'myWish'),
							Markup.callbackButton('Вернуться в главное меню', 'goBackAfterList')
						], {columns: 1}).extra());	
				else 
					ctx.replyWithHTML(`${wishBuffer.list[wishBuffer.id.indexOf(ctx.from.id)][locBuf].name}\n Примерная стоимость: ${wishBuffer.list[wishBuffer.id.indexOf(ctx.from.id)][locBuf].price}`, 
						Markup.inlineKeyboard([
							Markup.callbackButton('Удалить', '~d'+locBuf),
							Markup.callbackButton('Назад', 'myWish'),
							Markup.callbackButton('Вернуться в главное меню', 'goBackAfterList')
						], {columns: 1}).extra());	
			} else	{
				await ctx.replyWithPhoto(wishBuffer.list[wishBuffer.id.indexOf(ctx.from.id)][locBuf].pictId);
				if (!trig) 
					ctx.replyWithHTML(`${wishBuffer.list[wishBuffer.id.indexOf(ctx.from.id)][locBuf].name}\n Примерная стоимость: ${wishBuffer.list[wishBuffer.id.indexOf(ctx.from.id)][locBuf].price}\nссылка: ${wishBuffer.list[wishBuffer.id.indexOf(ctx.from.id)][locBuf].url}`, 
						Markup.inlineKeyboard([
							Markup.callbackButton('Назад', 'myWish'),
							Markup.callbackButton('Вернуться в главное меню', 'goBackAfterList')
						], {columns: 1}).extra());	
				else 
					ctx.replyWithHTML(`${wishBuffer.list[wishBuffer.id.indexOf(ctx.from.id)][locBuf].name}\n Примерная стоимость: ${wishBuffer.list[wishBuffer.id.indexOf(ctx.from.id)][locBuf].price}\nссылка: ${wishBuffer.list[wishBuffer.id.indexOf(ctx.from.id)][locBuf].url}`, 
						Markup.inlineKeyboard([
							Markup.callbackButton('Удалить', '~d'+locBuf),
							Markup.callbackButton('Назад', 'myWish'),
							Markup.callbackButton('Вернуться в главное меню', 'goBackAfterList')
						], {columns: 1}).extra());	
			}			
		}
	}
	
	if (buf==='goBackAfterList') {
		if (userIdBuffer.id.includes(ctx.from.id)) {
			if (wishBuffer.id.includes(ctx.from.id)) {
				wishBuffer.list.splice(wishBuffer.id.indexOf(ctx.from.id),1);
				wishBuffer.id.splice(wishBuffer.id.indexOf(ctx.from.id),1);
			}
			ctx.replyWithHTML('Главное меню', 
				Markup.inlineKeyboard([
					Markup.callbackButton('Мой список желаний', 'myWish'),
					Markup.callbackButton('Добавить желание', 'newWish'),
					Markup.callbackButton('Мой id', 'myId'),
					Markup.callbackButton('Что у других?', 'noReg'),
					Markup.callbackButton('Удалить аккаунт', 'deleteAkk')
				], {columns: 1}).extra());
		}
		if (mimoCrocodil.id.includes(ctx.from.id)) {
			console.log(mimoCrocodil);
			wishBuffer.list.splice(wishBuffer.id.indexOf(mimoCrocodil.seechId[mimoCrocodil.id.indexOf(ctx.from.id)]),1);
			wishBuffer.id.splice(wishBuffer.id.indexOf(mimoCrocodil.seechId[mimoCrocodil.id.indexOf(ctx.from.id)]),1);
			mimoCrocodil.filter.length == 1 ? mimoCrocodil.filter.pop() : mimoCrocodil.filter.splice(mimoCrocodil.id.indexOf(ctx.from.id),1);
			mimoCrocodil.seechId.length == 1 ? mimoCrocodil.seechId.pop() : mimoCrocodil.seechId.splice(mimoCrocodil.id.indexOf(ctx.from.id),1);
			mimoCrocodil.id.length == 1 ? mimoCrocodil.id.pop() : mimoCrocodil.id.splice(mimoCrocodil.id.indexOf(ctx.from.id),1);
		}
	}
	if ((buf[0]=='~')&&(buf[1]=='d')) {
		let locBuf = buf.substr(2,100);
		ctx.replyWithHTML(`Удаляем ${wishBuffer.list[wishBuffer.id.indexOf(ctx.from.id)][Number(locBuf)].name}?`, 
			Markup.inlineKeyboard([
				Markup.callbackButton('Да', '!~'+locBuf),
				Markup.callbackButton('Нет', 'goBackAfterList')
			], {columns: 1}).extra());		
	}
	
	if ((buf[0]=='!')&&(buf[1]=='~')) {
		let locBuf = Number(buf.substr(2,100));
		await deleteOne(ctx.from.id, locBuf);
		wishBuffer.list.splice(wishBuffer.id.indexOf(ctx.from.id),1);
		wishBuffer.id.splice(wishBuffer.id.indexOf(ctx.from.id),1);
		ctx.replyWithHTML('Выполнено', 
			Markup.inlineKeyboard([
				Markup.callbackButton('Мой список желаний', 'myWish'),
				Markup.callbackButton('Добавить желание', 'newWish'),
				Markup.callbackButton('Мой id', 'myId'),
				Markup.callbackButton('Что у других?', 'noReg'),
				Markup.callbackButton('Удалить аккаунт', 'deleteAkk')
			], {columns: 1}).extra());		
	}
	if (buf==='hisWish') {
		let aaa = [];
		for (i=0; i<wishBuffer.list[wishBuffer.id.indexOf(mimoCrocodil.seechId[mimoCrocodil.id.indexOf(ctx.from.id)])].length; i++)
			if (wishBuffer.list[wishBuffer.id.indexOf(mimoCrocodil.seechId[mimoCrocodil.id.indexOf(ctx.from.id)])][i].price<=locBuf)
				aaa.push(Markup.callbackButton(wishBuffer.list[wishBuffer.id.indexOf(mimoCrocodil.seechId[mimoCrocodil.id.indexOf(ctx.from.id)])][i].name, ('&&&~'+i.toString())));
		aaa.push(Markup.callbackButton('Вернуться в главное меню', 'goBackAfterList'));
		ctx.replyWithHTML(
			'Выбери по названию',
			Markup.inlineKeyboard(aaa, {columns: 1}).extra());
	}
	
	if (buf === 'myId') {
		ctx.replyWithHTML(ctx.from.id, 
			Markup.inlineKeyboard([
				Markup.callbackButton('Мой список желаний', 'myWish'),
				Markup.callbackButton('Добавить желание', 'newWish'),
				Markup.callbackButton('Что у других?', 'noReg'),
				Markup.callbackButton('Удалить аккаунт', 'deleteAkk')
			], {columns: 1}).extra());	
	}
	
}).catch((error) => {

    console.error(error);

 });

bot.on('text', async (ctx) => {
	var buf = ctx.message.text;
	if (userIdBuffer.id.includes(ctx.from.id))
	{
		console.log('bufferId');
		if (forSave.id.includes(ctx.from.id))
		{
			console.log('ForSave');
			let trim = true;
			let locId = forSave.id.indexOf(ctx.from.id);
			if ((forSave.name[locId] == '')&&(trim))
			{
				forSave.name[locId] = buf;
				trim = false;
				ctx.reply('Введи примерную цену в рублях. Укажи округленное значение в руб. без копеек');
			}
			if ((forSave.price[locId] == 0)&&(trim)&&(Number(buf)))
			{
				forSave.price[locId] = Number(buf);
				trim = false;
				ctx.reply('Укажи URL товара если знаешь. Если не знаешь, укажи прочерк (-)');
			}
			if ((forSave.price[locId] == 0)&&(trim)&&(!Number(buf)))
			{
				ctx.reply('Пожалуйста, повтори ввод. Используй только цифры');	
				trim = false;				
			}
			if ((forSave.url[locId] == '')&&(trim))
			{
				forSave.url[locId] = buf;	
				trim = false;
				ctx.reply('Пришли мне изображение вещи. Если не знаешь, укажи прочерк (-)');				
			}
			if ((forSave.pict[locId] == '')&&(trim))
			{
				forSave.pict[locId] = '-';	
				trim = false;
				ctx.reply(`итак, давай посмотрим что получилось\n\nНазвание: ${forSave.name[locId]}\nЦена: ${forSave.price[locId]}\nСсылка: ${forSave.url[locId]}`);
				ctx.replyWithHTML('Все верно?', 
					Markup.inlineKeyboard([
						Markup.callbackButton('Да!', 'yesSaveWish'),
						Markup.callbackButton('Нет', 'noSave')
					], {columns: 2}).extra());
			}
		}
	}
	if ((mimoCrocodil.id.includes(ctx.from.id))&&(mimoCrocodil.filter[mimoCrocodil.id.indexOf(ctx.from.id)]==undefined)){
		if (!(Number(buf)>=0)) ctx.reply('Повтори ввод. Неверное значние');
		if (Number(buf)>=0) {
			locBuf = Number(buf);
			let setter = true;
			console.log('352');
			if ((!userIdBuffer.id.includes(locBuf))&&(mimoCrocodil.seechId[mimoCrocodil.id.indexOf(ctx.from.id)]==undefined)) {		
				if (userIdBuffer.id.includes(ctx.from.id))
					ctx.replyWithHTML('Такой пользователь не найден\n', 
						Markup.inlineKeyboard([
							Markup.callbackButton('Мой список желаний', 'myWish'),
							Markup.callbackButton('Добавить желание', 'newWish'),
							Markup.callbackButton('Мой id', 'myId'),
							Markup.callbackButton('Что у других?', 'noReg'),
							Markup.callbackButton('Удалить аккаунт', 'deleteAkk')
						], {columns: 1}).extra());		
				else
					ctx.replyWithHTML(
						'Такой пользователь не найден\n',
						Markup.inlineKeyboard([
							Markup.callbackButton('Зарегистрироваться', 'yesReg'),
							Markup.callbackButton('Просто посмотреть', 'noReg')
						], {columns: 2}).extra())
				mimoCrocodil.id.splice(mimoCrocodil.id.indexOf(ctx.from.id),1);
				setter = false;
			}
			if ((userIdBuffer.id.includes(locBuf))&&(mimoCrocodil.seechId[mimoCrocodil.id.indexOf(ctx.from.id)]==undefined)){
				mimoCrocodil.seechId[mimoCrocodil.id.indexOf(ctx.from.id)]=locBuf;
				ctx.reply('Укажи максимальную ожидаемую стоимость подарка в рублях. Используй только цифры. Если цена не важна, укажи 0');
				setter = false;
			}
			if ((setter)&&(mimoCrocodil.seechId[mimoCrocodil.id.indexOf(ctx.from.id)]!=undefined)) {
				console.log('im here');
				if (locBuf == 0) locBuf = 10000000000;
				mimoCrocodil.filter.push(locBuf);
				await wishList(mimoCrocodil.seechId[mimoCrocodil.id.indexOf(ctx.from.id)]);
				let aaa = [];
				if (wishBuffer.list[wishBuffer.id.indexOf(mimoCrocodil.seechId[mimoCrocodil.id.indexOf(ctx.from.id)])]==0) {								
					ctx.replyWithHTML(
						'Данный пользователь не составил список\n',
						Markup.inlineKeyboard([
							Markup.callbackButton('Зарегистрироваться', 'yesReg'),
							Markup.callbackButton('Просто посмотреть', 'noReg')
						], {columns: 2}).extra());
					wishBuffer.list.splice(wishBuffer.id.indexOf(mimoCrocodil.seechId[mimoCrocodil.id.indexOf(ctx.from.id)]));
					wishBuffer.id.splice(wishBuffer.id.indexOf(mimoCrocodil.seechId[mimoCrocodil.id.indexOf(ctx.from.id)]));
					mimoCrocodil.filter.splice(mimoCrocodil.id.indexOf(ctx.from.id),1);
					mimoCrocodil.seechId.splice(mimoCrocodil.id.indexOf(ctx.from.id),1);
					mimoCrocodil.id.splice(mimoCrocodil.id.indexOf(ctx.from.id),1);
				}
				else {
					for (i=0; i<wishBuffer.list[wishBuffer.id.indexOf(mimoCrocodil.seechId[mimoCrocodil.id.indexOf(ctx.from.id)])].length; i++)
						if (wishBuffer.list[wishBuffer.id.indexOf(mimoCrocodil.seechId[mimoCrocodil.id.indexOf(ctx.from.id)])][i].price<=locBuf)
							aaa.push(Markup.callbackButton(wishBuffer.list[wishBuffer.id.indexOf(mimoCrocodil.seechId[mimoCrocodil.id.indexOf(ctx.from.id)])][i].name, ('&&&~'+i.toString())));
					if (aaa.length>0){
						aaa.push(Markup.callbackButton('Вернуться в главное меню', 'goBackAfterList'));
						ctx.replyWithHTML(
						'Выбери по названию',
						Markup.inlineKeyboard(aaa, {columns: 1}).extra());
					}
					else {
						if (userIdBuffer.id.includes(ctx.from.id))
							ctx.replyWithHTML('Ничего подходящего не нашлось\n', 
								Markup.inlineKeyboard([
									Markup.callbackButton('Мой список желаний', 'myWish'),
									Markup.callbackButton('Добавить желание', 'newWish'),
									Markup.callbackButton('Мой id', 'myId'),
									Markup.callbackButton('Что у других?', 'noReg'),
									Markup.callbackButton('Удалить аккаунт', 'deleteAkk')
								], {columns: 1}).extra());		
						else							
							ctx.replyWithHTML(
								'Ничего подходящего не нашлось\n',
								Markup.inlineKeyboard([
									Markup.callbackButton('Зарегистрироваться', 'yesReg'),
									Markup.callbackButton('Просто посмотреть', 'noReg')
								], {columns: 2}).extra());						
						wishBuffer.list.splice(wishBuffer.id.indexOf(mimoCrocodil.seechId[mimoCrocodil.id.indexOf(ctx.from.id)]));
						wishBuffer.id.splice(wishBuffer.id.indexOf(mimoCrocodil.seechId[mimoCrocodil.id.indexOf(ctx.from.id)]));
						mimoCrocodil.filter.splice(mimoCrocodil.id.indexOf(ctx.from.id),1);
						mimoCrocodil.seechId.splice(mimoCrocodil.id.indexOf(ctx.from.id),1);
						mimoCrocodil.id.splice(mimoCrocodil.id.indexOf(ctx.from.id),1);
					}
				}
				
			}
		}
	}
	console.log(wishBuffer);
	console.log(mimoCrocodil);
});

bot.launch();
console.log('bot start');

function newIdSave (id){
	mongoClient.connect(function(err, client){
      
		const db = client.db("wishBot");
		const collection = db.collection("userIdBuffer");
		let bbuf = 'user'+id.toString();
		let user = {tgId: id, collectionId: bbuf};
		collection.insertOne(user, function(err, result){
          
			if(err){ 
				return console.log(err);
			}
			console.log(result);
			userIdBuffer.id.push(id);
			userIdBuffer.collectionId.push(bbuf);
		});
		const collectionW = db.collection(bbuf);	
		collectionW.countDocuments(function(err, result){
           
			if(err){ 
				return console.log(err);
			}
			client.close();
		});	
		return true;
	});
}

async function deleteOne (id, wishId){
	const promise = new Promise (async function(resolve, reject){
		try {
			await mongoClient.connect();
			const db = mongoClient.db("wishBot");
			const collection = db.collection('user'+id.toString());
			const result = await collection.deleteOne({id: wishId});		
			resolve (true);
		} catch {
			console.log(err);	
			reject (err);
		} finally {
			await mongoClient.close();		
		}
	});
	await promise.then(function (value) {
		console.log ('deleteOne end sucss.');
		return true;
	});
}

async function deleteId (id){
	let bbuf = 'user'+id.toString();
	const promise = new Promise (async function(resolve, reject){
		try {
			await mongoClient.connect();     		  
			const db = mongoClient.db("wishBot");
			const result = await db.collection(bbuf).drop();
			const result2 = await db.collection("userIdBuffer").deleteOne({tgId: id});
			userIdBuffer = {
				id: [],
				collectionId: []
			}
			const result3 = await db.collection("userIdBuffer").find().toArray();
			if(result.length>0)
				for (i=0; i<result.length;i++){
					userIdBuffer.id[i] = result[i].tgId;
					userIdBuffer.collectionId[i] = result[i].collectionId;
				}
			resolve(true);
		} catch {
			console.log(error);
			reject(error);			
		} finally {
			mongoClient.close();			
		}
	});
	await promise.then(function(value){
		console.log('akkDeleted = ' + value);
	});
};

async function wishList (id) {	
	const promise = new Promise (async function(resolve, reject){
		let buffer = [];
		try {
			await (mongoClient.connect());
			const db = mongoClient.db("wishBot");
			const collection = db.collection('user'+id.toString());	
			let result = await (collection.countDocuments());
			console.log(result);
			if (result==0) {
				wishBuffer.id.push(id);
				wishBuffer.list.push(0);
				resolve(0);
				console.log('nnnn '+ buffer);
			}
			if (result!=0)
			{
				buffer = await (collection.find().toArray());
				if (wishBuffer.id.includes(id)) {
				wishBuffer.list[wishBuffer.id.indexOf(id)]=buffer;
				}
				else {
					wishBuffer.id.push(id);
					wishBuffer.list.push(buffer);
				}
				resolve(buffer);
			}
		} catch(err) {
			console.log(err);
		} finally {
			await (mongoClient.close());
		}
	});
	await promise.then(function (value){
		console.log('Вызов из промиса' + value);
		console.log('Buffer в промисе' + wishBuffer.id);
		console.log('Buffer list в промисе' + wishBuffer.list);
	});
}

function saveWish(id, name, price, url, pictId) {
	mongoClient.connect(function(err, client){
		const db = client.db("wishBot");
		const collection = db.collection('user'+id.toString());	
		let data = {
			id: 0,
			name: name,
			price: price,
			url: url,
			pictId: pictId
		}
		collection.countDocuments(function(err, result){
           
			if(err){ 
				return console.log(err);
			}
			data.id = result;
			collection.insertOne(data, function(err, result){
				if(err){ 
					return console.log(err);
				}
				client.close();
			});
		});
		return true;
	});
}

process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))

client.on('connectFailed', function(error) {
    console.log('Connect Error: ' + error.toString());
	setTimeout(() => {
		console.log('reconnect');
		client.connect('wss://spamigor.site:' + socketPort, 'echo-protocol');
	}, 60*1000)
});

client.on('connect', function(connection) {
    console.log('WebSocket Client Connected');
    connection.on('error', function(error) {
        console.log("Connection Error: " + error.toString());
    });
    connection.on('close', function() {
        console.log('echo-protocol Connection Closed');
		setTimeout(() => {
			console.log('reconnect');
			client.connect('wss://spamigor.site:' + socketPort, 'echo-protocol');
		}, 60*1000)
    });
    connection.on('message', function(message) {
        if (message.type === 'utf8') {
			console.log("Received: '" + message.utf8Data + "'");
        }
    });
    
    function sendNumber() {
        if (connection.connected) {
            var number = new Date();
            connection.sendUTF('wi: ' + (Number(number)).toString());
            setTimeout(sendNumber, 60*1000);
        }
    }
    sendNumber();
});

client.connect('wss://spamigor.site:' + socketPort, 'echo-protocol');