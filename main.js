const madge = require('madge')
const glob = require('glob')
const path = require('path')


const SRC_DIR  = path.resolve(__dirname, 'src')

/**
 * 获取入口文件列表
 *
 * @param {String} dirPath
 * @return {String[]} 
 */
const getEntries = (dirPath) => {
    const files = glob.sync(`${dirPath}/**/*+(.ts|.js)`)
    return files
}

/**
 * 生成依赖树
 *
 * @param {String[]} [entries=[]] 入口 list
 * @return {Object}  {entryPath: depsPath[]}
 */
const generatorDepsTree = async (entries = []) => {
    const options = {
        baseDir: SRC_DIR,
        fileExtensions: ['.js', '.ts'],
        detectiveOptions: {
            "es6": {
            "mixedImports": true
            }
        }
    }

    // madge 生成整个 tree 原始树
    const depsTree = await Promise.all(entries.map(async (entry) => {
        const result = await madge(entry, options)
        return result.tree
    }))

    // 展开树
    const depsTreeExpend = depsTree.map(tree => {
        return Object.values(tree).reduce((all, cur) => {
            return all.concat(cur) 
        }, [])
    })

    // 拼接上 入口文件作为 key
    const result = depsTreeExpend.reduce((all, cur, index) => {
        all[entries[index]] = cur
        return all
    }, {})
    
    return result
}

async function main () {
    const entries = getEntries(path.join(SRC_DIR, 'pages'))
    console.log('获取到的入口文件列表 ', entries)

    const depsTree = await generatorDepsTree(entries)
    console.log('生成依赖树', depsTree)
}

main()