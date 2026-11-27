'use strict';
(() => {
  const field = id => document.getElementById(id);
  const sample = window.boardingSample;
  const localVotes = new Map();
  let city = 'bogota';
  let cities = {bogota:{name:'Bogotá',timezone:'America/Bogota',operator:'TransMilenio'}};
  let catalogRevision=0;
  const clock = zone => new Intl.DateTimeFormat('es-CO', {timeZone:zone,hour:'2-digit',minute:'2-digit',hourCycle:'h23'});
  const labelTime = epoch => clock(cities[city].timezone).format(epoch*1000);
  const norm = value => String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  let routes=[], stops=[], selection=0, request=0;
  async function api(path, args, post=false) {
    const response=await fetch('/api/'+path+(post?'':'?'+new URLSearchParams(args)),
      post ? {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(args)} : {});
    if (!response.ok) throw Error(response.status===429 ? 'Alcanzaste el límite temporal de avisos.' : 'La fuente no respondió. Vuelve a intentarlo.');
    return response.json();
  }
  function choices(id, rows, filter, label) {
    const select=field(id), prior=select.value, q=norm(field(filter).value.trim());
    const matched=rows.filter(row=>row.some(value=>norm(value).includes(q)));
    select.replaceChildren(...matched.map(row=>new Option(label(row),row[0])));
    if(matched.some(row=>row[0]===prior)) select.value=prior;
    select.disabled=!matched.length;
    return matched.length;
  }
  function list(id, lines) {
    field(id).replaceChildren(...lines.map(line=>{
      const li=document.createElement('li'); li.textContent=line; return li;
    }));
  }
  function scope(){return {city,route:field('route').value,stop:field('stop').value};}
  function localRows(pair) {
    return [...localVotes.values()].filter(v=>v.route===pair.route && v.stop===pair.stop && v.expires>Date.now()/1000);
  }
  function showReports(rows) {
    list('reports',rows.length ? rows.map(r=>r.kind+' · '+r.count+' '+(r.count===1?'observación':'observaciones')+' · vence '+labelTime(r.expires)) : ['Sin avisos activos en esta selección.']);
  }
  async function refresh() {
    const token=++request, pair=scope(), ready=Boolean(pair.route && pair.stop);
    field('report').disabled=!ready;
    field('refresh').disabled=false;
    for(const id of ['reports','feedback','arrivals','source']) field(id).replaceChildren();
    field('status').textContent=ready?'Consultando llegadas…':'Selecciona una ruta y un paradero.';
    if(!ready) return;
    if(sample){
      field('status').textContent='Las llegadas se consultan en la versión conectada.';
      field('source').textContent=sample.source; showReports(localRows(pair)); return;
    }
    api('alerts',pair).then(rows=>{if(token===request) showReports(rows);})
      .catch(e=>{if(token===request) field('feedback').textContent=e.message;});
    try {
      const data=await api('board',pair);
      if(token!==request) return;
      field('source').textContent=cities[city].operator+' · consulta '+labelTime(data.now)+' · actualización operativa '+(data.feed?new Date(data.feed*1000).toISOString():'sin fecha disponible');
      const fresh=data.feed && data.now>=data.feed && data.now-data.feed<=180;
      field('status').textContent=(data.rows.length?'Próximos 90 minutos.':'Sin llegadas disponibles en los próximos 90 minutos.')+(fresh?'':' Se usa el horario publicado.');
      list('arrivals',data.rows.map(r=>labelTime(r.at)+' · '+r.route+' '+r.destination+' · '+r.kind));
    } catch(e){if(token===request) field('status').textContent=e.message;}
  }
  function filterStops() {
    const n=choices('stop',stops,'sq',r=>r[1]+' · '+(r[2]||r[0]));
    field('matches').textContent=n?n+' paraderos coincidentes':'Sin paraderos coincidentes.';
    refresh();
  }
  async function loadStops() {
    const token=++selection, route=field('route').value;
    stops=[]; filterStops();
    if(!route) return;
    try{
      const rows=sample?sample.stops[route]:await api('route-stops',{city,route});
      if(token===selection){stops=rows; filterStops();}
    }catch(e){if(token===selection) field('matches').textContent=e.message;}
  }
  function filterRoutes() {
    choices('route',routes,'rq',r=>r[1]+' · '+r[2]);
    loadStops();
  }
  async function start(){
    const revision=++catalogRevision;
    try{
      if(!sample && !field('city').options.length){
        cities=await api('cities',{});
        field('city').replaceChildren(...Object.entries(cities).map(([id,c])=>new Option(c.name,id)));
        field('cityLabel').hidden=Object.keys(cities).length<2;
        field('city').value=city;
      }
      const rows=sample?sample.routes:await api('routes',{city});
      if(revision===catalogRevision){routes=rows;filterRoutes();}
    }
    catch(e){field('status').textContent=e.message;}
  }
  field('city').onchange=()=>{
    city=field('city').value; routes=[]; filterRoutes();
    field('mode').textContent=cities[city].name+' · elige la ruta por código o destino.'; start();
  };
  field('rq').oninput=filterRoutes; field('route').onchange=loadStops;
  field('sq').oninput=filterStops; field('stop').onchange=refresh;
  field('refresh').onclick=()=>!routes.length?start():!stops.length?loadStops():refresh();
  field('report').onclick=async()=>{
    const token=request,pair=scope(),kind=field('kind').value;
    field('report').disabled=true;
    try{
      let rows;
      if(sample){
        const key=JSON.stringify([pair.route,pair.stop,kind]);
        if(!localVotes.has(key)||localVotes.get(key).expires<=Date.now()/1000)
          localVotes.set(key,{...pair,kind,count:1,expires:Math.floor(Date.now()/1000)+1800});
        rows=localRows(pair);
      }else rows=await api('alerts',{...pair,kind},true);
      if(token===request){showReports(rows);field('feedback').textContent=sample?'Aviso de práctica en esta pestaña.':'Tu observación quedó registrada para esta ruta y paradero.';}
    }catch(e){if(token===request) field('feedback').textContent=e.message;}
    finally{if(token===request) field('report').disabled=false;}
  };
  field('mode').textContent=sample?'Muestra sin conexión · rutas reales de Bogotá. Los avisos de práctica solo aparecen en esta pestaña.':'Bogotá · elige la ruta por código o destino.';
  field('report').disabled=true; start();
  setInterval(()=>{if(!document.hidden && field('stop').value) refresh();},60000);
})();
