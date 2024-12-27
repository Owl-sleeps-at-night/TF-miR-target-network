
let miRTargetData = [];
let TFMiRNAData = [];
let globalMiRTargetData = []; // 全局变量，用于存储筛选后的 miRNA-target 数据
let globalTFMiRNAData = []; // 全局变量，用于存储筛选后的 TF-miRNA 数据
window.onload = loadData;
console.log("script2.js is loaded");
// 加载 JSON 文件
async function loadData() {
    try {
        // 加载 miRNA-target 数据
        const miRResponse = await fetch('./ipredict_miR-Target.json');
        miRTargetData = await miRResponse.json();

        // 加载 TF-miRNA 数据
        const TFMiRNAResponse = await fetch('./TF-miRNA_12_8_literature_and_level2.json');
        TFMiRNAData = await TFMiRNAResponse.json();

        // 规范化 TF-miRNA 中的 miRNA 名称
        miRTargetData.forEach(item => {
            item.miRNA = item.miRNA.map(name =>
                name
                    .replace(/\s+/g, '') // 去除空格
                    .replace('Hsa', 'hsa') // 替换 Hsa 为 hsa
                    .replace('-miR', '-mir') // 替换 -mir 为 -miR
            );
        });

        console.log('Loaded miRTargetData:', miRTargetData);
        console.log('Loaded TFMiRNAData (normalized):', TFMiRNAData);
    } catch (error) {
        console.error('Error loading JSON files:', error);
    }
}

function filterSubcellularLocations() {
    // 获取用户选择的筛选条件
    const cellCondition = document.getElementById('cell_condition').value;
    const artCondition = document.getElementById('ART_condition').value;
    const cancerCondition = document.getElementById('cancer_condition').value;

    // 筛选 miRNA-target 数据
    let filteredMiRTarget = miRTargetData.filter(item => {
        return (
            (cellCondition ? item.cell_condition.includes(cellCondition) : true) &&
            (artCondition ? item.ART_condition.includes(artCondition) : true) &&
            (cancerCondition ? item.cancer_condition.includes(cancerCondition) : true)
        );
    });

    console.log('miRNA-target:', filteredMiRTarget);

    // 提取 Target_gene 和 Subcellular_location 信息并去重
    const uniqueTargets = filteredMiRTarget.reduce((acc, item) => {
        const target = item.Target_Gene[0];
        const subcellularLocation = item.Subcellular_location ? item.Subcellular_location[0] : "No data";

        // 如果不存在，添加到结果
        if (!acc.some(entry => entry.target === target)) {
            acc.push({ target, subcellularLocation });
        }
        return acc;
    }, []);

    console.log('Unique Targets:', uniqueTargets);

    // 动态填充表格
    populateTargetTable(uniqueTargets);

    // 将筛选后的 miRNA-target 数据保存到全局变量，供下一步使用
    window.filteredMiRTargetStep1 = filteredMiRTarget;

// 填充表格函数
function populateTargetTable(targetData) {
    const tableBody = document.querySelector('#target-table tbody');
    tableBody.innerHTML = ''; // 清空之前的内容

    targetData.forEach(entry => {
        const row = document.createElement('tr');

        // 创建 Target 列
        const targetCell = document.createElement('td');

        targetCell.textContent = entry.target;
        targetCell.style.padding = '8px';
        targetCell.style.border = '1px solid #ddd';
        row.appendChild(targetCell);

        // 创建 Subcellular Location 列
        const subcellularCell = document.createElement('td');
        subcellularCell.textContent = entry.subcellularLocation;
        subcellularCell.style.padding = '8px';
        subcellularCell.style.border = '1px solid #ddd';
        row.appendChild(subcellularCell);

        tableBody.appendChild(row);
    });
}

    const subcellularCount = {};
    // 提取并统计 Subcellular_location 分类
    // const subcellularLocations = new Set();
    filteredMiRTarget.forEach(item => {
        if (item.Subcellular_location) {
            const locations = item.Subcellular_location[0].split(',');
            locations.forEach(location => {
                subcellularCount[location] = (subcellularCount[location] || 0) + 1;
            });
        }
    });

    console.log('Subcellular Locations:', subcellularCount);

    // 动态生成勾选框
    displaySubcellularTable(subcellularCount);

    // 将筛选后的 miRNA-target 数据保存到全局变量，供下一步使用
    window.filteredMiRTargetStep1 = filteredMiRTarget;

    const targetPanel = document.querySelector("#target-panel");
    if (!targetPanel.classList.contains("open")) {
        targetPanel.classList.add("open");
    }
}

// 根据用户选择的条件筛选数据
function filterData() {
    const checkedLocations = Array.from(
        document.querySelectorAll('#subcellular-table-body input[type="checkbox"]:checked')
    ).map(input => input.value);

    if (checkedLocations.length === 0) {
        alert('Please select at least one Subcellular Location.');
        return;
    }
    console.log('Selected Subcellular Locations:', checkedLocations);
    // 获取第一步筛选结果
    let filteredMiRTarget =  window.filteredMiRTargetStep1.filter(item => {
        if (item.Subcellular_location) {
            const locations = item.Subcellular_location[0].split(',');
            return locations.some(location => checkedLocations.includes(location.trim()));
        }
        return false;
    });

    console.log('Filtered miRNA-target based on Subcellular Location:', filteredMiRTarget);

    // 获取用户选择的模式
    const mode = document.getElementById('mode').value;
    console.log('Current mode selected:', mode);  // 添加日志查看当前选择的模式



    if(mode==='co-regulation'){
        const filteredMiRTargetCount = filteredMiRTarget.reduce((acc, item) => {
            if (!acc[item.miRNA]) {
                acc[item.miRNA] = new Set();
            }
            acc[item.miRNA].add(item.Target_Gene);
            return acc;
        }, {});
        console.log('miRtarget count', filteredMiRTargetCount);
        // 只保留那些 target 数量大于 1 的 miRNA
        const targetsWithMultipleRNAs = Object.keys(filteredMiRTargetCount).filter(target => filteredMiRTargetCount[target].size > 1);
        console.log('miRNAs with multiple targets:', targetsWithMultipleRNAs);
        const filteredmiRNAsWithMultipletargets = filteredMiRTarget.filter(item => {
            // 如果 item.miRNA是数组，提取第一个元素
            const miRname = Array.isArray(item.miRNA) ? item.miRNA[0] : item.miRNA;

            // 检查是否包含在 targetsWithMultipleMiRNAs 中
            return targetsWithMultipleRNAs.includes(miRname);
        });
        console.log('New mir-target relation:', filteredmiRNAsWithMultipletargets);
        filteredMiRTarget = filteredmiRNAsWithMultipletargets

    }else{
        // 在 "full" 模式下，只执行常规的筛选
        console.log("Full mode selected, skipping co-regulation specific processing.");
    }
    // 检查 filteredMiRTarget 是否为空
    if (filteredMiRTarget.length === 0) {
        // 显示警告信息
        alert("No targets regulated by multiple miRNAs found for the selected Subcellular Locations, try showing all miRNA-target pairs!");
        return; // 终止后续逻辑
    }
    // 更新 Network Target Table
    updateTargetTable(filteredMiRTarget);

    const targetPanel = document.querySelector("#target-panel");
    if (!targetPanel.classList.contains("open")) {
        targetPanel.classList.add("open");
    }

    // 提取 miR_family 信息
    const miRFamilies = new Map();
    filteredMiRTarget.forEach(item => {
        const family = item.miR_family[0]; // 假设 `miR_family` 是一个数组
        if (miRFamilies.has(family)) {
            miRFamilies.set(family, miRFamilies.get(family) + 1);
        } else {
            miRFamilies.set(family, 1);
        }
    });

    console.log('miRNA Families:', miRFamilies);

    // 在页面上生成勾选框
    displayMiRFamilyTable(miRFamilies);

    // 暂存筛选结果以供后续使用
    window.filteredMiRTargetStep2 = filteredMiRTarget;


}

function applyMiRFamilyFilter() {
    // 获取用户勾选的 miRNA Family 条件
    const selectedFamilies = Array.from(
        document.querySelectorAll('#miRFamilyTableBody input[type="checkbox"]:checked')
    ).map(input => input.value);

    if (selectedFamilies.length === 0) {
        alert('Please select at least one miRNA Family.');
        return;
    }

    console.log('Selected miRNA Families:', selectedFamilies);

    // 根据 miRNA Family 筛选 miRNA-target 数据
    let filteredMiRTarget = window.filteredMiRTargetStep2.filter(item =>
        selectedFamilies.includes(item.miR_family[0])
    );

    console.log('Filtered miRNA-target by miRNA Family:', filteredMiRTarget);

    // 获取此时的 miRNA 集合
    const selectedMiRNAs = new Set(filteredMiRTarget.map(item => item.miRNA[0]));

    // 根据当前的 miRNA 集合筛选 TF-miRNA 数据
    const filteredTFMiRNA = TFMiRNAData.filter(item => selectedMiRNAs.has(item.miRNA[0]));
    console.log('Filtered TF-miRNA Data:', filteredTFMiRNA);

    // 统计每个 TF 对应的 miRNA 数量
    const tfMiRNACount = filteredTFMiRNA.reduce((acc, item) => {
        if (!acc[item.TF]) {
            acc[item.TF] = new Set();
        }
        acc[item.TF].add(item.miRNA);
        return acc;
    }, {});
    console.log('TF-miRNA count:', tfMiRNACount);

    // 只保留那些 miRNA 数量大于 1 的 TF
    const tfWithMultipleMiRNAs = Object.keys(tfMiRNACount).filter(tf => tfMiRNACount[tf].size > 1);
    console.log('TFs with multiple miRNAs:', tfWithMultipleMiRNAs);

    // 使用 tfWithMultipleMiRNAs 筛选出对应的 TF-miRNA 关系对
    const filteredTFWithMultipleMiRNAs = filteredTFMiRNA.filter(item => {
        const tfName = Array.isArray(item.TF) ? item.TF[0] : item.TF;
        return tfWithMultipleMiRNAs.includes(tfName);
    });

    console.log('Filtered miRNA-target:', filteredMiRTarget);
    console.log('Filtered TF-miRNA:', filteredTFWithMultipleMiRNAs);

    // 更新 Network Target Table
    updateTargetTable(filteredMiRTarget);
    // 更新全局变量
    globalMiRTargetData = filteredMiRTarget;
    globalTFMiRNAData = filteredTFWithMultipleMiRNAs;

    // 绘制网络图
    drawDisjointForceDirectedGraph(globalMiRTargetData, globalTFMiRNAData);
    // drawNetwork(globalMiRTargetData, globalTFMiRNAData);

    // 关闭 target-panel
    const targetPanel = document.querySelector("#target-panel");
    const toggleButton = document.querySelector("#toggle-panel-button");
    if (targetPanel.classList.contains("open")) {
        targetPanel.classList.remove("open"); // 收回面板
        toggleButton.innerHTML = "&gt;"; // 改为向右箭头
    }
}

function displaySubcellularTable(subcellularCount) {
    const tableBody = document.getElementById('subcellular-table-body');
    tableBody.innerHTML = '';
    // 提取 Subcellular 数据，并按首字母排序
    const sortedLocations = Object.keys(subcellularCount).sort((a, b) => a.localeCompare(b));
    sortedLocations.forEach(location => {
        const row = document.createElement('tr');

        // Subcellular location 名称
        const locationCell = document.createElement('td');
        locationCell.textContent = location;
        row.appendChild(locationCell);
        // 复选框
        const selectCell = document.createElement('td');
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.value = location;
        selectCell.appendChild(checkbox);
        row.appendChild(selectCell);

        tableBody.appendChild(row);
    });
}

function displayMiRFamilyTable(miRFamilies) {
    const tableBody = document.getElementById('miRFamilyTableBody');
    tableBody.innerHTML = ''; // 清空内容
    // 提取 miRNA Family 数据，并按首字母排序
    const sortedFamilies = Array.from(miRFamilies.keys()).sort((a, b) => a.localeCompare(b));

    sortedFamilies.forEach(family => {
        const row = document.createElement('tr');

        // miR-family 名称
        const familyCell = document.createElement('td');
        familyCell.textContent = family;
        row.appendChild(familyCell);
        // 复选框
        const selectCell = document.createElement('td');
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.value = family;
        selectCell.appendChild(checkbox);
        row.appendChild(selectCell);

        tableBody.appendChild(row);
    });

    // 显示 miRNA-family 信息的表格
    document.getElementById('miRFamilySection').style.display = 'block';
    // 显示 filter2 按钮
    document.getElementById('filter2Button').style.display = 'inline-block';

    // 全选功能的初始化
    const selectAllCheckbox = document.getElementById('selectAllFamilies');
    selectAllCheckbox.addEventListener('change', () => {
        const checkboxes = tableBody.querySelectorAll('input[type="checkbox"]');
        checkboxes.forEach(checkbox => {
            checkbox.checked = selectAllCheckbox.checked;
        });
    });

    // 自动更新全选状态（如果用户手动取消某个复选框）
    tableBody.addEventListener('change', () => {
        const checkboxes = tableBody.querySelectorAll('input[type="checkbox"]');
        const allChecked = Array.from(checkboxes).every(checkbox => checkbox.checked);
        selectAllCheckbox.checked = allChecked;
    });
}

function downloadDataAsTabDelimited(data, fileName) {
    let content = '';

    // 检查是否有数据
    if (data.length > 0) {
        // 获取数据的表头（从数据的键提取）
        const headers = Object.keys(data[0]);
        content += headers.join('\t') + '\n'; // 使用制表符分隔表头

        // 填充每一行数据
        data.forEach(item => {
            const row = headers.map(key => Array.isArray(item[key]) ? item[key].join(', ') : item[key] || '').join('\t');
            content += row + '\n';
        });
    } else {
        // 如果没有数据，给出提示
        content = 'No data available to download.\n';
    }

    // 创建 Blob 对象以触发下载
    const blob = new Blob([content], { type: 'text/plain' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = fileName; // 设置下载文件名
    link.click();
}
// 更新 Network Target Table 的内容
function updateTargetTable(filteredMiRTarget) {
    const tableBody = document.querySelector("#target-table tbody");
    tableBody.innerHTML = ""; // 清空表格内容

    // 使用 Map 对 Target 去重
    const uniqueTargets = Array.from(
        new Map(
            filteredMiRTarget.map(item => [
                item.Target_Gene[0], // Map 的键为 Target_Gene（唯一键）
                {
                    target: item.Target_Gene[0],
                    subcellularLocation: item.Subcellular_location ? item.Subcellular_location[0] : "No data"
                }
            ])
        ).values()
    );

    // 遍历去重后的数据
    uniqueTargets.forEach(item => {
        const row = document.createElement("tr");

        // 添加 Target 列
        const targetCell = document.createElement("td");
        targetCell.textContent = item.target;
        row.appendChild(targetCell);

        // 添加 Subcellular Location 列
        const locationCell = document.createElement("td");
        locationCell.textContent = item.subcellularLocation;
        row.appendChild(locationCell);

        // 将行添加到表格
        tableBody.appendChild(row);
    });
}
//下面是绘制网络图的部分

//Disjoint force-directed graph Disjoint情况下的力导向布局，适合网络图被分成很多小簇时数据的展示
function drawDisjointForceDirectedGraph(filteredMiRTarget, filteredTFWithMultipleMiRNAs) {
    const width = 1200, height = 600;

    document.querySelector("#search-node-button").addEventListener("click", () => {
        const searchInput = document.querySelector("#node-search-input").value.trim();

        if (!searchInput) {
            alert("Please enter a node name to search.");
            return;
        }

        // 在当前图中查找匹配的节点
        const matchedNode =  nodes.find(node => node.id.toLowerCase().trim() === searchInput.toLowerCase().trim());

        if (matchedNode) {
            console.log("Node found:", matchedNode);
            highlightNode(matchedNode); // 调用高亮节点逻辑
        } else {
            alert(`Node "${searchInput}" not found in the network.`);
        }
    });



    // 1. 数据整理：转换成 nodes 和 links 格式
    const nodes = [];
    let links = [];
    // 定义实验条件到颜色的映射
    const experimentColors = {
        "Western ": "red",
        "PCR": "blue",
        "reporter": "#31a354",
        "default": "grey"
    };


    filteredMiRTarget.forEach(item => {
        let miRNA = item.miRNA[0];
        let target = item.Target_Gene[0];
        if (!nodes.some(node => node.id === miRNA)) nodes.push({ id: miRNA, group: "miRNA" });
        if (!nodes.some(node => node.id === target)) nodes.push({ id: target, group: "target" });

        // 解析实验条件
        const experiments = (item.expreiment && item.expreiment.length > 0)
            ? item.expreiment[0].split(',').map(e => e.trim()) // 如果存在，拆分实验条件并去掉多余空格
            : []; // 如果 expreiment 不存在或为空，则返回空数组
        // 为每个实验条件添加边
        experiments.forEach(exp => {
            let matched = false;
            // 遍历实验条件与颜色的映射，匹配字段
            Object.keys(experimentColors).forEach(key => {
                if (exp.toLowerCase().includes(key.toLowerCase())) { // 判断实验条件是否包含对应字段
                    links.push({ source: miRNA, target: target, color: experimentColors[key] });
                    matched = true;
                }
            });
            // 如果实验条件未匹配到任何已定义的字段，使用默认颜色
            if (!matched) {
                links.push({ source: miRNA, target: target, color: experimentColors["default"] });
            }
        });
    });
    // 在调试输出 links
    console.log("Generated nodes:", nodes);
    console.log("Generated links:", links);

    filteredTFWithMultipleMiRNAs.forEach(item => {
        let tf = item.TF[0];
        let miRNA = item.miRNA[0];

        if (!nodes.some(node => node.id === tf)) nodes.push({ id: tf, group: "TF" });
        if (!nodes.some(node => node.id === miRNA)) nodes.push({ id: miRNA, group: "miRNA" });

        // 根据 relation 字段调整边的样式
        const relation = item.relation ? String(item.relation).split(',').map(r => r.trim()) : [];
        let style = "default"; // 默认样式
        let strokeDasharray = "none"; // 默认实线
        let markerEnd = null; // 默认无箭头
        if (relation.includes("Activation") && relation.includes("Repression")) {
            style = "dashed"; // 虚线
        } else if (relation.includes("Activation")) {
            style = "arrow"; // 箭头
        } else if (relation.includes("Repression")) {
            style = "dashed-arrow"; // 虚线箭头
            strokeDasharray = "5,5"; // 定义虚线
            markerEnd = "url(#arrowhead)"; // 定义箭头
        }
        links.push({
            source: tf,
            target: miRNA,
            color: experimentColors["default"],
            style: style,
            strokeDasharray: strokeDasharray,
            markerEnd: markerEnd
        });
    });

    // 修改 links 数据结构，确保 source 和 target 是节点的 id
    links = links.map(link => ({
        ...link, // 保留其他属性，例如 color
        source: typeof link.source === "string" ? nodes.find(node => node.id === link.source) : link.source,
        target: typeof link.target === "string" ? nodes.find(node => node.id === link.target) : link.target
    }));
    console.log("Generated links:", links);
    // 清理旧图
    d3.select("#network").selectAll("*").remove();
    // 添加 SVG 容器
    const svg = d3.select("#network")
        .attr("width", width)
        .attr("height", height);
    // 定义缩放行为
    const zoom = d3.zoom()
        .scaleExtent([0.1, 5]) // 设置缩放范围
        .on("zoom", (event) => {
            g.attr("transform", event.transform); // 应用缩放和平移
        });
    // 将缩放行为绑定到 SVG
    svg.call(zoom);
    // 创建一个 g 元素用于平移和缩放
    const g = svg.append("g");
    // 2. 定义力导向模拟器
    const simulation = d3.forceSimulation(nodes)
        .force("link", d3.forceLink(links).id(d => d.id).distance(80)) // 链接力
        .force("charge", d3.forceManyBody().strength(d => (d.group === "target" ? -800 : -600))) // 排斥力
        .force("center", d3.forceCenter(width / 2, height / 2)) // 居中力
        .force("target_center", d3.forceRadial(0, width / 2, height / 2).strength(d => (d.group === "target" ? 0.8 : 0))) // Target 节点居中)
        .force("miRNA_radial", d3.forceRadial(400, width / 2, height / 2).strength(d => (d.group === "miRNA" ? 0.8 : 0))) // miRNA 环绕
        .force("TF_radial", d3.forceRadial(500, width / 2, height / 2).strength(d => (d.group === "TF" ? 0.8 : 0))); // TF 外围

    // 4. 绘制边
    const link = g.append("g")
        .attr("class", "links")
        .attr("stroke-opacity", 1)
        .selectAll("path")
        .data(links)
        .enter().append("path")
        .attr("fill", "none")
        .attr("stroke", d => d.color) // 根据 links 的 color 属性设置边的颜色
        .attr("stroke-width", 1)
        .attr("stroke-dasharray", d => {
            console.log("Stroke Dasharray for edge:", d.strokeDasharray); // 调试日志
            return d.strokeDasharray;
        }) // 虚线
        .attr("marker-end", d => {
            console.log("Marker End for edge:", d.markerEnd); // 调试日志
            return d.markerEnd;
        }) // 箭头
        .attr("d", d => calculatePath(d, links)); // 使用 calculatePath 函数计算路径

    // 动态调整箭头位置函数
    function getArrowRefX(nodeRadius) {
        return nodeRadius + 25; // 箭头位置基于节点半径 + 一些额外的偏移
    }
    // 定义箭头标记
    svg.append("defs").append("marker")
        .attr("id", "arrowhead")
        .attr("viewBox", "0 -5 10 10")
        .attr("refX", getArrowRefX(20))
        .attr("refY", 0)
        .attr("markerWidth", 6)
        .attr("markerHeight", 6)
        .attr("orient", "auto")
        .append("path")
        .attr("d", "M0,-5L10,0L0,5")
        .attr("fill", "black");

    // 5. 绘制节点组
    const node = g.append("g")
        .attr("class", "node")
        .selectAll("g")
        .data(nodes)
        .enter().append("g") // 每个节点的容器
        .attr("class", "node");
    // 绘制节点形状
    node.append("circle")
        .attr("r", 20) // 节点半径
        .attr("fill", d => d.group === "miRNA" ? "#A8D5BA" : d.group === "TF" ? "#5BC0EB" : "#FF6F61")
        .attr("stroke", d => d.group === "miRNA" ? "#A8D5BA" : d.group === "TF" ? "#5BC0EB" : "#FF6F61") // 边框颜色与填充一致
        .attr("stroke-width", 0.5) // 更细的边框
        .call(d3.drag()
            .on("start", dragstarted)
            .on("drag", dragged)
            .on("end", dragended));
    // 添加节点标签
    node.append("text")
        .attr("text-anchor", "middle") // 文本居中
        .attr("dy", "0.35em") // 垂直居中
        .text(d => d.id) // 显示节点名称
        .style("font-size", "12px") // 字体大小
        .style("font-weight", "bold") // 加粗
        .style("fill", "black") // 字体颜色为白色
        .style("pointer-events", "none") // 禁止干扰鼠标事件
        .style("user-select", "none"); // 禁止文本被选中
    // 6. 力学模拟更新位置
    simulation.on("tick", () => {
        link.attr("d", d => calculatePath(d, links));
        node.attr("transform", d => `translate(${d.x},${d.y})`);
    });
    node.on("click", (event, d) => {
            event.stopPropagation();
            highlightNode(d);

    });
    // 为 SVG 背景添加点击事件，清除高亮
    svg.on("click", () => {
        resetHighlight(); // 清除所有高亮
    });
    // 7. 高亮功能
    function highlightNode(selectedNode) {
        // 获取与当前节点相连的边和节点
        const connectedLinks = links.filter(link => link.source.id === selectedNode.id || link.target.id === selectedNode.id);
        const connectedNodes = new Set(connectedLinks.flatMap(link => [link.source.id, link.target.id]));

        // 更新边样式
        link.attr("stroke-opacity", d => connectedNodes.has(d.source.id) && connectedNodes.has(d.target.id) ? 1 : 0.1)


        // 更新节点样式
        node.select("circle")
            .attr("fill-opacity", d => connectedNodes.has(d.id) ? 1 : 0.1) // 高亮节点透明度变高
            .attr("stroke-opacity", d => connectedNodes.has(d.id) ? 1 : 0.1) // 非相关节点透明
            .attr("stroke", d => d.id === connectedNodes.has(d.id) ? "#f00" : "#fff") // 高亮当前节点边框
            .attr("stroke-width", d => d.id === connectedNodes.has(d.id) ? 1 : 0.5); // 高亮当前节点加粗边框


    }
    // 8. 清除高亮
    function resetHighlight() {
        // 重置边样式
        link.attr("stroke-opacity", 1)
            .attr("stroke-width", 1); // 边恢复正常宽度

        // 重置节点样式
        node.select("circle")
            .attr("fill-opacity", 1)
            .attr("stroke-opacity", 1)
            .attr("stroke", "#fff")
            .attr("stroke-width", 1.5);


    }

    // 拖拽行为函数
    function dragstarted(event, d) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
    }

    function dragged(event, d) {
        d.fx = event.x;
        d.fy = event.y;
    }

    function dragended(event, d) {
        if (!event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;

    }

    // 计算路径函数
    function calculatePath(d, links) {
        const sameEdgeGroup = links.filter(
            edge =>
                (edge.source.id === d.source.id && edge.target.id === d.target.id) ||
                (edge.source.id === d.target.id && edge.target.id === d.source.id)
        );

        const index = sameEdgeGroup.indexOf(d); // 当前边在组内的索引
        const offset = (index - (sameEdgeGroup.length - 1) / 2) * 500; // 偏移量
        const curvature = 0.5; // 曲率调整

        const dx = d.target.x - d.source.x;
        const dy = d.target.y - d.source.y;
        const dr = Math.sqrt(dx * dx + dy * dy) * (1 + Math.abs(offset) * curvature); // 根据偏移量调整曲率

        return `M${d.source.x},${d.source.y}A${dr},${dr} 0 0,1 ${d.target.x},${d.target.y}`;
    }
}
document.getElementById("toggle-panel-button").addEventListener("click", () => {
    const panel = document.getElementById("target-panel");
    const button = document.getElementById("toggle-panel-button");

    // 如果面板当前隐藏，则显示
    if (panel.style.display === "none" || !panel.style.display) {
        panel.style.display = "flex"; // 显示面板
        button.innerHTML = "&lt;"; // 改为向左箭头
    } else {
        panel.style.display = "none"; // 隐藏面板
        button.innerHTML = "&gt;"; // 改为向右箭头
    }
});





