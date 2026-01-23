// admin.js (FINAL)
let data=JSON.parse(localStorage.getItem("appData"))||{};
init();
function init(){
  document.getElementById("lojaAberta").value=data.config.lojaAberta;
  document.getElementById("horario").value=data.config.horario;
  document.getElementById("tempoEntrega").value=data.config.tempoEntrega;
  document.getElementById("kmGratis").value=data.config.kmGratis;
  document.getElementById("valorKm").value=data.config.valorKm;
  document.getElementById("limiteKm").value=data.config.limiteKm;
}
function salvar(){
  data.config.lojaAberta=document.getElementById("lojaAberta").value==="true";
  data.config.horario=document.getElementById("horario").value;
  data.config.tempoEntrega=document.getElementById("tempoEntrega").value;
  data.config.kmGratis=Number(document.getElementById("kmGratis").value);
  data.config.valorKm=Number(document.getElementById("valorKm").value);
  data.config.limiteKm=Number(document.getElementById("limiteKm").value);
  localStorage.setItem("appData",JSON.stringify(data));
  alert("Salvo");
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