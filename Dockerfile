FROM nginx:alpine
COPY index.html studio.html landing.css styles.css favicon.svg app.js themes.js converter.js validator.js original-visuals-data.js original-visuals.js /usr/share/nginx/html/
COPY assets /usr/share/nginx/html/assets/
COPY vendor/marked.min.js /usr/share/nginx/html/vendor/marked.min.js
COPY motion /usr/share/nginx/html/motion/
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
