npx webpack
zip -x "publish.sh" -x ".idea" -x "./node_modules/*" -x ".git" -x ".gitignore" -x "package-lock.json" -x "package.json" -x "./nbproject/*" -r ../thunderbird-seafile-2.zip *
