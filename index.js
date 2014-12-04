var count = 0;
var spawn = require('child_process').spawn;
var fs = require('fs');

function parseUml(page, chapterPath, baseName) {
    uml = page.content.match(/^```uml((.*\n)+?)?```$/igm);
    if (uml) {
        fs.writeFileSync(chapterPath + "/" + baseName + ".uml", uml);
        return true;
    }
    return false;
}

function execFile(command, args, callback) {
    var prc = spawn(command, args);

    prc.on('error', function (err) {
        console.log('cannot spawn java');
    });

    prc.stdout.on('data', function(data) {
        console.log(data.toString());
    });

    prc.stderr.on('data', function(data) {
        console.log(data.toString());
    });

    prc.on('close', function(code) {
        if ("function" === typeof callback) callback(!!code);
    });
};

module.exports = {
    book: {
        assets: "./book",
        js: [
            "test.js"
        ],
        css: [
            "test.css"
        ],
        html: {
            "html:start": function() {
                return "<!-- Start book " + this.options.title + " -->"
            },
            "html:end": function() {
                return "<!-- End of book " + this.options.title + " -->"
            },

            "head:start": "<!-- head:start -->",
            "head:end": "<!-- head:end -->",

            "body:start": "<!-- body:start -->",
            "body:end": "<!-- body:end -->"
        }
    },
    hooks: {
        // For all the hooks, this represent the current generator

        // This is called before the book is generated
        "init": function() {
            console.log("init gitbook-plugin-plantuml!");
        },

        // This is called after the book generation
        "finish": function() {
            console.log("finish gitbook-plugin-plantuml!");
        },

        // The following hooks are called for each page of the book
        // and can be used to change page content (html, data or markdown)


        // Before parsing markdown
        "page:before": function(page) {
            // page.path is the path to the file
            // page.content is a string with the file markdown content

            var pathToken = page.path.split('/')

            var chapterPath
            var baseName

            if (pathToken.length == 1) {
                chapterPath = '.'
                baseName = pathToken[0].split('.')[0]
            }
            else {
                chapterPath = pathToken[0]
                baseName = pathToken[1].split('.')[0]
            }

            var hasUml = parseUml(page, chapterPath, baseName);
            if (!hasUml) { return page; }

            console.log('processing uml... %j', page.path);

            var lines = fs.readFileSync(chapterPath + '/' + baseName + '.uml', 'utf8').split('```,');
            //UML
            debugger;
            try {
                execFile('java', ['-jar',
                    'plantuml.jar',
                    '-tsvg',
                    chapterPath + '/' + baseName + '.uml',
                    '-o',
                    chapterPath
                ]);
            } catch (e) {};
            for (var i = 0; i < lines.length; i++) {
                if (i == 0) {
                    page.content = page.content.replace(lines[i], '![](' + chapterPath + '/' + baseName + '.svg)');
                    continue;
                }
                if (i < 10) {
                    page.content = page.content.replace(lines[i], '![](' + chapterPath + '/' + baseName + '_00' + i + '.svg)');
                    continue;
                }
                if (i >= 10 && i < 100) {
                    page.content = page.content.replace(lines[i], '![](' + chapterPath + '/' + baseName + '_0' + i + '.svg)');
                    continue;
                }
                if (i >= 100) {
                    page.content = page.content.replace(lines[i], '![](' + chapterPath + '/' + baseName + '_' + i + '.svg)');
                    continue;
                }
            };
            page.content = page.content.replace(/```/g, '');
            // Example:
            //page.content = "# Title\n" + page.content;

            return page;
        },

        // Before html generation
        "page": function(page) {
            // page.path is the path to the file
            // page.sections is a list of parsed sections

            // Example:
            //page.sections.unshift({type: "normal", content: "<h1>Title</h1>"})

            return page;
        },

        // After html generation
        "page:after": function(page) {
            // page.path is the path to the file
            // page.content is a string with the html output

            // Example:
            //page.content = "<h1>Title</h1>\n" + page.content;
            // -> This title will be added before the html tag so not visible in the browser

            return page;
        }
    }
};
