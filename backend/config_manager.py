class ConfigurationManager:
    def __init__(self, config_file=None):
        self.config_file = config_file
        self.configs = {}
        if config_file and os.path.exists(config_file):
            self.load_config()
    
    def load_config(self):
        with open(self.config_file, 'r') as f:
            self.configs = json.load(f)
    
    def save_config(self):
        with open(self.config_file, 'w') as f:
            json.dump(self.configs, f, indent=2)
    
    def get_server_config(self, server_id):
        return self.configs.get(server_id, {})
    
    def set_server_config(self, server_id, config):
        self.configs[server_id] = config
        if self.config_file:
            self.save_config()