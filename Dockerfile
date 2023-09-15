FROM --platform=linux/amd64 nginx

ARG CLIENT_VERSION=5.0.12

COPY nginx.conf /etc/nginx/conf.d/default.conf

RUN mkdir /srv/www

ADD dist/periodo-client-${CLIENT_VERSION} /srv/www/

RUN chown -R nginx /srv/www
