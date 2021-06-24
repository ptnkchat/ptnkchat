## PTNK Chatible

[![Deploy](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy)

#### Chatible clone written in TypeScript, based on Node, Express and Mongo

Demo: https://m.me/ptnkchat

## Basic instruction

- Deploy to Heroku using the deploy button.
- Create a cluster on MongoDB Atlas. Whitelist IP addresses.
- Create an app on Facebook. Install Webhook. Get app secret and tokens.
- Set Heroku's `Config Vars`. Check [.env.example](.env.example) to know which variables you need to set.
- Enjoy!

## Features

- Admin dashboard ([code](https://github.com/ptnkchat/ptnkchat.github.io))
- Pair by gender (e.g. male with female)
- Send cute dog/cat pictures
- Customizable message templates
- Cache database in memory to increase performance
- Developed with performance in mind

## Planned features

- Allow editing profile via Messenger Webview
- Limiting rate of requests sent out to avoid being converted to [high-MPS](https://developers.facebook.com/docs/messenger-platform/send-messages/high-mps) page

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details

## Credit

- Nguyen Xuan Son (a.k.a Nui or [@ngxson](https://github.com/ngxson)) for [Chatbot CHN](https://github.com/ngxson/chatbot-cnh) on which this project was originally based
- Le Bao Hiep ([@hieplpvip](https://github.com/hieplpvip)) for maintaining this project
