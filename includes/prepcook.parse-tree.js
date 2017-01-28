var tree = tree || require('bistro.js.tree');

var parseTree = (function pathFactory() {

    // Foreach path, log a callback as data.
    var myTree = new tree.Tree('root', null),
    myRoot = myTree.getRoot('root');


    /**
     * Add a template snipit to the internal parse tree. 
     * 
     * @param {string} type
     *   The type of code/command of the passed data
     * @param {string} parentId
     *   The ID of the parent this snipit is a child of.
     * @param {Node} parent
     *   The actual parent node, in place of a parent, to lower paternal location costs.
     * @param {object} data
     *   The actual meat (data) of the node/operation/snipit.
     * 
     * @return {Node}
     *   The newly added node.
     */
    function add_leaf (type, parentId, parent, data) {

        console.log(' -> Adding Leaf: ' + type + ' to parent: ');
        
        try {
            // Attempt to get the parent node, if not passed, using either the ID,
            // or defaulting to the root.
            if (parent == null && parendId == null) { parentId = myTree.getRoot(); }
            if (parent == null && parentId) { parent = myTree.getNode(parentId); }
            if (!parent) { throw new Error('Cannot load parent node, or find root. Make sure tree was initialized.'); }

            // Generate unique ID based upon a node type.
            var my_uniqueid = myTree.getNextUniqueId(type);

            var my_node_data = {
                type: type,
                data: data
            }

            var my_node = myTree.add(my_uniqueid, my_node_data, parent);
        }
        catch (e) {
            console.warn('ParseTree.add_leaf(): ' + e);
            return false;
        }

        return my_node;
    }


    function dump() { myTree.dump(); }
    function get_root() { return myRoot; }

    return {
        tree: myTree,
        add_leaf: add_leaf,
        get_root: get_root,
        dump: dump
    };
})();


module.exports = {
    add: parseTree.add_leaf,
    root: parseTree.get_root,
    dump: parseTree.dump
};
