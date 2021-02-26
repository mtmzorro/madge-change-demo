const madge = require('madge')
const glob = require('glob')
const path = require('path')
const execSync = require('child_process').execSync;

const SRC_DIR  = path.resolve(__dirname, 'src')

/**
 * 获取修改的增量文件列表
 *
 * @return {String[]} 
 */
const getChangedList = () => {
    const GIT_DIFF = 'git diff --diff-filter=ACMR --name-only'

    // 执行 git 的命令
    const diffFiles = execSync(GIT_DIFF, {
            encoding: 'utf8',
        })
        .split('\n')
        .filter(filePath => filePath.length !== 0)
        // 统一为绝对路径
        .map(filePath => {
            return path.resolve(__dirname, filePath)
        })
        
    return diffFiles
}

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
 * @return {{entryPath: depsPath[]}} 依赖树
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
    const depsTreeOrigin = await Promise.all(entries.map(async (entry) => {
        const result = await madge(entry, options)
        return result.tree
    }))

    // 展开树数组为一维
    const depsTreeOriginExpend = depsTreeOrigin.map(tree => {
        const result = Object.values(tree)
            .reduce((all, cur) => {
                return all.concat(cur) 
            }, [])
            // 统一为绝对路径
            .map(filePath => {
                return path.resolve(SRC_DIR, filePath)
            })
        
        return result
    })

    // 拼接上 入口文件作为 key
    const depsTree = depsTreeOriginExpend.reduce((all, cur, index) => {
        all[entries[index]] = cur
        return all
    }, {})
    
    return depsTree
}

/**
 * 获取需要处理的入口文件
 *
 * @param {{entryPath: depsPath[]}} depsTree
 * @param {String[]} changedList
 * @return {String[]} 文件列表
 */
const getNeedBuildEntries = (depsTree, changedList) => {
    const needBuildEntries = []

    for(const key in depsTree){
        // 将入口文件 自身也加入待对比列表
        const deps = depsTree[key].concat([key])
        // 依检查依赖文件有变化 则推入待处理入口列表
        if( deps.some(dep => changedList.includes(dep)) ){ 
            needBuildEntries.push(key)
        }
    }
    
    return needBuildEntries
}

async function main () {
    const changedList = getChangedList()
    console.log('变动的文件列表', changedList)

    const entries = getEntries(path.join(SRC_DIR, 'pages'))
    console.log('获取到的入口文件列表 ', entries)

    const depsTree = await generatorDepsTree(entries)
    console.log('生成依赖树', depsTree)

    const needBuildEntries = getNeedBuildEntries(depsTree, changedList)
    console.log()
    console.log()
    console.log('需要变更处理的入口文件', needBuildEntries)
}

main()