const http=require('http'),fs=require('fs'),path=require('path'),crypto=require('crypto');
const ROOT=__dirname,PUBLIC=path.join(ROOT,'public'),DB=path.join(ROOT,'requests.json');
const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.svg':'image/svg+xml','.json':'application/json; charset=utf-8'};
function read(){try{return JSON.parse(fs.readFileSync(DB,'utf8'))}catch{return[]}}
function send(res,n,data,type='application/json; charset=utf-8'){res.writeHead(n,{'Content-Type':type,'Cache-Control':'no-store'});res.end(type.startsWith('application/json')?JSON.stringify(data):data)}
const server=http.createServer((req,res)=>{
  const u=new URL(req.url,'http://localhost');
  if(req.method==='POST'&&u.pathname==='/api/assessment'){
    let body='';req.on('data',d=>{body+=d;if(body.length>1e6)req.destroy()});req.on('end',()=>{try{
      const x=JSON.parse(body),required=['propertyType','prefecture','city','address','name','email','phone'];
      if(required.some(k=>!String(x[k]||'').trim()))return send(res,400,{ok:false,message:'必須項目を入力してください'});
      const rows=read(),item={id:'TS-'+new Date().toISOString().slice(0,10).replaceAll('-','')+'-'+crypto.randomBytes(3).toString('hex').toUpperCase(),createdAt:new Date().toISOString(),status:'未対応',...x};
      rows.unshift(item);fs.writeFileSync(DB,JSON.stringify(rows,null,2));send(res,201,{ok:true,id:item.id});
    }catch{send(res,400,{ok:false,message:'送信内容を確認してください'})}});return;
  }
  if(req.method==='GET'&&u.pathname==='/api/assessments')return send(res,200,read());
  let file=u.pathname==='/'?'index.html':u.pathname.slice(1);file=path.normalize(file).replace(/^(\.\.(\/|\\|$))+/, '');const full=path.join(PUBLIC,file);
  if(!full.startsWith(PUBLIC)||!fs.existsSync(full)||fs.statSync(full).isDirectory())return send(res,404,'Not found','text/plain; charset=utf-8');
  send(res,200,fs.readFileSync(full),types[path.extname(full)]||'application/octet-stream');
});
server.listen(3220,()=>console.log('\n✅ Tsunageru不動産査定 起動完了\n🌐 サイト: http://localhost:3210\n📋 管理画面: http://localhost:3210/admin.html\n'));
