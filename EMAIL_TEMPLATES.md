## A) Nouvelle note partagée
Subject: 💌 Nouvelle note de {{AUTHOR}}
HTML:
<!doctype html><html><body style="margin:0;background:#fff9fd;font-family:Arial,sans-serif;color:#3b2b2f">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:auto;border:2px solid #ffc6e9;border-radius:16px">
<tr><td style="padding:20px;text-align:center">
<div style="font-size:20px;font-weight:bold;color:#ff61c7">💌 Nouvelle note de {{AUTHOR}}</div>
<div style="margin-top:8px;font-size:14px;color:#5b4a4f">Humeur : <b>{{MOODS}}</b> — Journal du {{DAY}}</div>
<div style="margin-top:16px;padding:14px;background:#ffe6f3;border-radius:12px;color:#4a3840">{{EXCERPT}}</div>
<a href="{{DEEPLINK}}" style="display:inline-block;margin-top:18px;padding:12px 18px;background:#ff61c7;color:#fff;text-decoration:none;border-radius:12px;font-weight:bold">Ouvrir dans SeoulKit</a>
<div style="margin-top:20px;font-size:12px;color:#7b6a6f">SeoulKit — pour vous deux 🐱</div>
</td></tr></table></body></html>

## B) Neko a besoin de toi
Subject: 🔔 Neko a besoin de toi
HTML:
<!doctype html><html><body style="margin:0;background:#fffafc;font-family:Arial,sans-serif;color:#3b2b2f">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;margin:auto;border:2px dashed #ffc6e9;border-radius:16px">
<tr><td style="padding:20px;text-align:center">
<div style="font-size:20px;font-weight:800;color:#ff61c7">🔔 Neko a besoin de toi</div>
<div style="margin-top:10px;font-size:14px">Faim <b>{{HUNGER}}%</b> • Soif <b>{{THIRST}}%</b> • Propreté <b>{{CLEAN}}%</b></div>
<a href="{{DEEPLINK}}" style="display:inline-block;margin-top:16px;padding:10px 16px;background:#ff61c7;color:#fff;text-decoration:none;border-radius:12px;font-weight:700">Nourrir / Boire / Doucher</a>
</td></tr></table></body></html>

## C) Récap quotidien
Subject: 🗒️ Récap du {{DATE}}
HTML:
<!doctype html><html><body style="margin:0;background:#fff9fd;font-family:Arial,sans-serif;color:#3b2b2f">
<table role="presentation" width="100%" style="max-width:640px;margin:auto;border:1px solid #ffd2ef;border-radius:14px">
<tr><td style="padding:18px">
<div style="font-size:18px;font-weight:800;color:#ff61c7">🗒️ Récap du {{DATE}}</div>
<ul style="margin:12px 0 0 18px;line-height:1.5">
<li>Notes partagées : <b>{{NOTES_COUNT}}</b></li>
<li>“J’ai mangé” : <b>{{EAT_COUNT}}</b></li>
<li>“Je dors” (dernière) : <b>{{SLEEP_TIME}}</b></li>
<li>Neko : F{{HUNGER}}% • S{{THIRST}}% • P{{CLEAN}}% • Jours ➜ <b>{{DAYS}}</b></li>
</ul>
<a href="{{DEEPLINK}}" style="display:inline-block;margin-top:14px;padding:10px 16px;background:#ff61c7;color:#fff;text-decoration:none;border-radius:10px;font-weight:700">Voir la journée</a>
</td></tr></table></body></html>

## D) SOS
Subject: 🆘 SOS de {{AUTHOR}}
HTML:
<!doctype html><html><body style="margin:0;background:#fffafc;font-family:Arial,sans-serif;color:#3b2b2f">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;margin:auto;border:2px solid #ff9ed7;border-radius:16px">
<tr><td style="padding:20px;text-align:center">
<div style="font-size:20px;font-weight:800;color:#ff2a8b">🆘 SOS de {{AUTHOR}}</div>
<div style="margin-top:10px;font-size:14px">{{TEXT}}</div>
<a href="{{DEEPLINK}}" style="display:inline-block;margin-top:16px;padding:10px 16px;background:#ff2a8b;color:#fff;text-decoration:none;border-radius:12px;font-weight:700">Ouvrir SeoulKit</a>
</td></tr></table></body></html>
