#!/bin/sh
set -eu
umask 077
root=/home3/calltruckcpanel
forms="$root/public_html/forms.calltruck.com.ar"
backup="$root/calltruck-backups/pre-hardening-20261020"
mkdir -p "$backup"
# Keep cPanel's generated PHP handler when installing the application rules.
sed -n '/# php -- BEGIN cPanel-generated handler/,$p' "$forms/.htaccess" > "$backup/php-handler.txt"
cat "$root/calltruck-backups/forms.htaccess" "$backup/php-handler.txt" > "$forms/.htaccess"
chmod 644 "$forms/.htaccess"
if ! grep -q '# Calltruck protection' "$root/public_html/.htaccess"; then
    cp -p "$root/public_html/.htaccess" "$backup/root.htaccess"
    cat >> "$root/public_html/.htaccess" <<'RULES'

# Calltruck protection
Options -Indexes
<FilesMatch "^(php\.ini|\.user\.ini|\.env.*|.*\.(zip|tar|gz|bak|sql|log))$">
Require all denied
</FilesMatch>
RULES
fi
if ! grep -q '; Calltruck endpoint limits' "$forms/.user.ini"; then
    cat >> "$forms/.user.ini" <<'INI'

; Calltruck endpoint limits
display_errors = Off
display_startup_errors = Off
log_errors = On
file_uploads = Off
max_execution_time = 20
max_input_time = 20
memory_limit = 64M
post_max_size = 32K
session.use_strict_mode = 1
session.cookie_secure = 1
session.cookie_httponly = 1
session.cookie_samesite = Lax
INI
fi
chmod 700 "$root/.ssh" "$root/.calltruck-forms" "$root/calltruck-backups"
chmod 600 "$root/.ssh/authorized_keys"
find "$root/.calltruck-forms" -type f -exec chmod 600 {} \;
echo "Account hardening applied."
