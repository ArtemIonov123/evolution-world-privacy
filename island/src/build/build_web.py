import sys,re,json,time
src,outdir,sdkdir=sys.argv[1],sys.argv[2],sys.argv[3]
build=time.strftime('%Y%m%d-%H%M%S')
h=open(src,encoding='utf-8').read()
def strip(js): return re.sub(r'//# sourceMappingURL=\S+','',js).replace('</script','<\\/script')
app=strip(open(sdkdir+'/firebase-app-compat.js',encoding='utf-8').read())
auth=strip(open(sdkdir+'/firebase-auth-compat.js',encoding='utf-8').read())
import os
authurl=open('auth_url.txt').read().strip() if os.path.exists('auth_url.txt') else ''
dbs=strip(open(sdkdir+'/firebase-database-compat.js',encoding='utf-8').read())
ad=open('fb_adapter.js',encoding='utf-8').read()
inj='<script src="https://telegram.org/js/telegram-web-app.js"></script>\n<script>window.__islandBuild="'+build+'";window.__islandAuthUrl='+json.dumps(authurl)+';</script>\n<script>'+app+'</script>\n<script>'+auth+'</script>\n<script>'+dbs+'</script>\n<script>'+ad+'</script>\n'
i=h.index('<script>'); h=h[:i]+inj+h[i:]
meta=('<link rel="manifest" href="manifest.webmanifest">\n<meta name="mobile-web-app-capable" content="yes">\n'
      '<meta name="apple-mobile-web-app-capable" content="yes">\n<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">\n'
      '<meta name="apple-mobile-web-app-title" content="Wyspa">\n<link rel="apple-touch-icon" href="icon-192.png">\n<link rel="icon" href="icon-192.png">\n')
j=h.index('<style>'); h=h[:j]+meta+h[j:]
open(outdir+'/web_utf.html','w',encoding='utf-8').write(h)
json.dump({'build':build},open(outdir+'/version.json','w'))
json.dump({'name':'Wyspa','short_name':'Wyspa','start_url':'./','scope':'./','display':'fullscreen','orientation':'any',
  'background_color':'#2d2440','theme_color':'#2d2440',
  'icons':[{'src':'icon-192.png','sizes':'192x192','type':'image/png'},{'src':'icon-512.png','sizes':'512x512','type':'image/png'}]},
  open(outdir+'/manifest.webmanifest','w'),ensure_ascii=False)
print(build,len(h))
