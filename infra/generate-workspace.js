/* eslint-disable no-console */
const fs = require('fs');

const getDirectories = (source, callback) =>
  fs.readdir(source, { withFileTypes: true }, (err, files) => {
    if (err) {
      return console.log(err);
    }
    callback(
      files
        .filter((dirent) => dirent.isDirectory())
        .map((dirent) => dirent.name)
    );
  });

getDirectories(__dirname + '/../packages', (directories) => {
  const jsonData = {
    version: 2,
    projects: {
      ...directories.reduce(
        (acc, rec) => ({
          ...acc,
          [`packages/${rec}`]: {
            root: `packages/${rec}`,
            projectType: 'library',
            sourceRoot: `packages/${rec}/src`,
            targets: {
              prebuild: {
                executor: 'nx:run-commands',
                options: {
                  command:
                    'yarn depcheck --ignore-patterns=test,dist --ignores=buffer',
                  cwd: `packages/${rec}`,
                },
              },
              build: {
                executor: 'nx:run-commands',
                options: {
                  commands: [
                    `yarn workspace @metaplex-foundation/${rec} build`,
                  ],
                  parallel: false,
                },
                dependsOn: [
                  {
                    target: 'prebuild',
                    projects: 'self',
                  },
                  {
                    target: 'build',
                    projects: 'dependencies',
                  },
                ],
              },
              clean: {
                executor: 'nx:run-commands',
                options: {
                  commands: [
                    `yarn workspace @metaplex-foundation/${rec} clean`,
                  ],
                  parallel: false,
                },
              },
              publish: {
                executor: 'nx:run-commands',
                options: {
                  command: `node ./infra/publish.mjs packages/${rec} {args.ver} {args.tag}`,
                  forwardAllArgs: true,
                },
                dependsOn: [
                  {
                    projects: 'self',
                    target: 'build',
                  },
                ],
              },
              lint: {
                executor: '@nrwl/linter:eslint',
                outputs: ['{options.outputFile}'],
                options: {
                  lintFilePatterns: [`packages/${rec}/**/*.ts`],
                  fix: true,
                },
              },
              test: {
                executor: 'nx:run-commands',
                options: {
                  commands: [`yarn workspace @metaplex-foundation/${rec} test`],
                  parallel: false,
                },
                dependsOn: [
                  {
                    target: 'build',
                    projects: 'self',
                  },
                ],
              },
            },
            tags: [],
          },
        }),
        {}
      ),
    },
  };

  // stringify JSON Object
  const jsonContent = JSON.stringify(jsonData, null, 2);

  fs.writeFile('workspace.json', jsonContent, 'utf8', (err) => {
    if (err) {
      console.log('An error occured while writing JSON Object to File.');
      return console.log(err);
    }

    console.log('JSON file has been saved.');
  });
});
