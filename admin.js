// admin.js
let data=JSON.parse(localStorage.getItem("appData"))||{};
init();
function init(){
  lojaAberta.value=data.config.lojaAberta;
  horario.value=data.config.horario;
  tempoEntrega.value=data.config.tempoEntrega;
  kmGratis.value=data.config.kmGratis;
  valorKm.value=data.config.valorKm;
  limiteKm.value=data.config.limiteKm;
}
function exportar(){
  const blob=new Blob([JSON.stringify(data,null,2)],{type:"application/json"});
  const a=document.createElement("a");
  a.href=URL.createObjectURL(blob);
  a.download="app.json";
  a.click();
}
function importar(e){
  const r=new FileReader();
  r.onload=x=>{data=JSON.parse(x.target.result);localStorage.setItem("appData",JSON.stringify(data));init()};
  r.readAsText(e.target.files[0]);
}